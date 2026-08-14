'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../server');
const { digest } = require('../src/a2spa-r/canonical');
const { issueEnvelope } = require('../src/a2spa-r/envelope');
const { KeyStore } = require('../src/a2spa-r/key-store');
const { FileReplayStore } = require('../src/a2spa-r/replay');
const { verifyReceipt } = require('../src/a2spa-r/receipt');
const { AuditLedger } = require('../src/audit/ledger');
const { createDevelopmentSigner } = require('../src/security/managed-signer');
const { AuthorizationIssuer } = require('../src/security/authorization-issuer');
const { SyntheticIdentityProvider } = require('../src/integrations/synthetic-platform');
const { PolicyRegistry, issuePolicyPack, policyDigest } = require('../src/policy/policy-pack');

const authorizationKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const receiptKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const policyKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const policyPack = issuePolicyPack({
  id: 'policy.synthetic', version: '1.0.0', publisher: 'policy-authority.synthetic', keyId: 'policy-key-1', institution: 'institution.synthetic', jurisdiction: 'jurisdiction.synthetic',
  publishedAt: '2020-01-01T00:00:00.000Z', effectiveAt: '2020-01-01T01:00:00.000Z', expiresAt: '2099-01-01T00:00:00.000Z', supersedes: null,
  approvals: [{ role: 'policy-owner', approver: 'owner.synthetic', approvedAt: '2020-01-01T00:10:00.000Z' }, { role: 'legal-rights', approver: 'rights.synthetic', approvedAt: '2020-01-01T00:20:00.000Z' }],
  rules: [{ id: 'permit-breach', effect: 'permit', actions: ['realtime.defense.breach.detect'], purposes: ['synthetic-test'], principalTypes: ['service'], humanApproval: { required: false, roles: [] }, rights: { notice: true, humanReview: true, appeal: true, remedy: true } }]
}, policyKeys.privateKey);
const policy = { id: policyPack.id, version: policyPack.version, digest: policyDigest(policyPack) };
const principal = { id: 'service-subject', issuer: 'https://identity.example.invalid', tenantId: 'tenant-a', workloadId: 'workload-a', type: 'service', scopes: ['action:realtime.defense.breach.detect', 'audit:verify', 'audit:export', 'case:create', 'case:read', 'case:review'], roles: ['reviewer'], tokenId: 'token-1' };
const requestBody = { actionType: 'realtime.defense.breach.detect', payload: { breachId: 'SYNTHETIC-1', affectedRecords: 10, dataFlow: 'test-flow' } };

function issueAuthorization(body = requestBody, overrides = {}) {
  const context = { action: body.actionType, payloadDigest: digest(body.payload, 'action-payload'), purpose: 'synthetic-test', institution: 'institution.synthetic', jurisdiction: 'jurisdiction.synthetic', retentionClass: 'test-short', legalHold: false, ...overrides.context };
  return issueEnvelope({
    issuer: 'issuer.synthetic', keyId: 'authorization-key-1', tenant: principal.tenantId, workload: principal.workloadId,
    audience: 'executor.synthetic', permissions: [body.actionType], policy, context,
    claimsDigest: digest(context, 'authorization-context'), ...overrides
  }, authorizationKeys.privateKey);
}

function createFixture(t, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-server-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const auditLedger = new AuditLedger({ directory: path.join(root, 'audit') });
  const replayStore = new FileReplayStore({ directory: path.join(root, 'replay') });
  const policyRegistry = new PolicyRegistry({ packs: [policyPack], keyStore: new KeyStore([{ issuer: 'policy-authority.synthetic', keyId: 'policy-key-1', algorithm: 'ES256', publicKey: policyKeys.publicKey }]), active: policyPack });
  const config = {
    authorizationAudience: 'executor.synthetic',
    authorizationKeys: new KeyStore([{ issuer: 'issuer.synthetic', keyId: 'authorization-key-1', algorithm: 'ES256', publicKey: authorizationKeys.publicKey }]),
    authorizationIssuers: ['issuer.synthetic'], policy, deploymentDigest: 'b'.repeat(64), receiptKeyId: 'receipt-key-1',
    caseDirectory: path.join(root, 'cases'), corsOrigins: ['https://allowed.example'], bodyLimit: '4kb', rateLimit: 10, rateWindowMs: 60000, clockSkewSeconds: 30, metricsToken: 'synthetic-metrics-token',
    ...overrides.config
  };
  return {
    config, auditLedger, replayStore, policyRegistry,
    signer: overrides.signer || createDevelopmentSigner({ keyId: 'receipt-key-1', privateKey: receiptKeys.privateKey }),
    authorizationIssuer: overrides.authorizationIssuer || new AuthorizationIssuer({ issuer: 'issuer.synthetic', keyId: 'authorization-key-1', privateKey: authorizationKeys.privateKey, audience: 'executor.synthetic', policy: { ...policy, institution: 'institution.synthetic', jurisdiction: 'jurisdiction.synthetic' } }),
    identityVerifier: overrides.identityVerifier || (async token => { if (token !== 'synthetic-token') throw Object.assign(new Error(), { code: 'INVALID_TOKEN' }); return principal; })
  };
}

async function withServer(options, callback) {
  const app = createApp({ logger: { info() {}, error() {} }, execute: async actionType => ({ status: 'completed', actionType }), ...options });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('serves public assets and reports dependency-aware readiness', async t => {
  const fixture = createFixture(t);
  await withServer(fixture, async base => {
    assert.equal((await fetch(`${base}/`)).status, 200);
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: 'ok' });
    assert.deepEqual(await (await fetch(`${base}/ready`)).json(), { status: 'ready' });
    assert.equal((await fetch(`${base}/metrics`)).status, 404);
    const metrics = await fetch(`${base}/metrics`, { headers: { 'x-metrics-token': 'synthetic-metrics-token' } });
    assert.equal(metrics.status, 200);
    assert.match(await metrics.text(), /beyondbeams_dependency_ready/);
  });
});

test('requires bearer identity and externally issued authorization, then returns a signed receipt', async t => {
  const fixture = createFixture(t);
  await withServer(fixture, async base => {
    assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization() })).status, 401);
    const success = await post(base, { ...requestBody, authorization: issueAuthorization() }, 'synthetic-token');
    assert.equal(success.status, 200);
    const body = await success.json();
    assert.equal(body.receipt.protocol, 'A2SPA-R-RECEIPT/1');
    assert.equal(body.receipt.tenant, principal.tenantId);
    const receiptStore = new KeyStore([{ issuer: 'receipt-service', keyId: 'receipt-key-1', algorithm: 'ES256', publicKey: receiptKeys.publicKey }]);
    assert.equal(verifyReceipt(body.receipt, receiptStore).valid, true);
    assert.equal(fixture.auditLedger.verify().valid, true);
  });
});

test('rejects duplicate, tampered payload, wrong tenant, policy mismatch, unknown and revoked keys', async t => {
  const fixture = createFixture(t);
  await withServer(fixture, async base => {
    const authorization = issueAuthorization();
    assert.equal((await post(base, { ...requestBody, authorization }, 'synthetic-token')).status, 200);
    assert.equal((await post(base, { ...requestBody, authorization }, 'synthetic-token')).status, 409);
    assert.equal((await post(base, { ...requestBody, payload: { ...requestBody.payload, affectedRecords: 11 }, authorization: issueAuthorization() }, 'synthetic-token')).status, 403);
    assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization(requestBody, { tenant: 'tenant-b' }) }, 'synthetic-token')).status, 403);
    assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization(requestBody, { policy: { ...policy, digest: 'c'.repeat(64) } }) }, 'synthetic-token')).status, 403);
    assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization(requestBody, { keyId: 'unknown-key' }) }, 'synthetic-token')).status, 403);
  });

  const revokedFixture = createFixture(t, { config: { authorizationKeys: new KeyStore([{ issuer: 'issuer.synthetic', keyId: 'authorization-key-1', algorithm: 'ES256', publicKey: authorizationKeys.publicKey, revokedAt: '2000-01-01T00:00:00.000Z' }]) } });
  await withServer(revokedFixture, async base => assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization() }, 'synthetic-token')).status, 403));
});

test('fails closed when replay, audit, or key services are unavailable', async t => {
  const replayFailure = createFixture(t);
  replayFailure.replayStore = { consume() { const error = new Error(); error.code = 'REPLAY_STORE_UNAVAILABLE'; throw error; } };
  await withServer(replayFailure, async base => assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization() }, 'synthetic-token')).status, 403));

  const signerFailure = createFixture(t, { signer: { algorithm: 'ES256', keyId: 'receipt-key-1', readiness: async () => false } });
  await withServer(signerFailure, async base => assert.equal((await post(base, { ...requestBody, authorization: issueAuthorization() }, 'synthetic-token')).status, 503));

  const auditFailure = createFixture(t);
  auditFailure.auditLedger = { verify: () => ({ valid: false }), append() { const error = new Error(); error.code = 'AUDIT_STORE_UNAVAILABLE'; throw error; } };
  await withServer(auditFailure, async base => assert.equal((await fetch(`${base}/ready`)).status, 503));
});

test('does not misstate a successful execution when receipt audit persistence fails', async t => {
  const fixture = createFixture(t);
  let executions = 0;
  const append = fixture.auditLedger.append.bind(fixture.auditLedger);
  fixture.auditLedger.append = (type, data) => {
    if (type === 'receipt_issued') throw Object.assign(new Error(), { code: 'AUDIT_STORE_UNAVAILABLE' });
    return append(type, data);
  };
  await withServer({ ...fixture, execute: async actionType => { executions += 1; return { status: 'completed', actionType }; } }, async base => {
    const response = await post(base, { ...requestBody, authorization: issueAuthorization() }, 'synthetic-token');
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'EVIDENCE_UNAVAILABLE');
    assert.equal(executions, 1);
  });
});

test('protects tenant-scoped audit verification and export and logs access', async t => {
  const fixture = createFixture(t);
  fixture.auditLedger.append('receipt_issued', { tenant: 'tenant-b', receiptId: 'other', retentionClass: 'test-short', legalHold: false });
  await withServer(fixture, async base => {
    const integrity = await fetch(`${base}/audit/integrity`, { headers: { Authorization: 'Bearer synthetic-token' } });
    assert.equal(integrity.status, 200);
    const exported = await fetch(`${base}/audit/export`, { headers: { Authorization: 'Bearer synthetic-token' } });
    assert.equal(exported.status, 200);
    const body = await exported.json();
    assert.equal(body.records.every(record => record.data.tenant === principal.tenantId), true);
    assert.equal(body.records.some(record => record.type === 'audit_accessed'), true);
  });
});

test('creates cases through policy-bound server authorization and supports same-origin sessions', async t => {
  const fixture = createFixture(t);
  fixture.identityProvider = new SyntheticIdentityProvider();
  fixture.identityProvider.sessions.set('session-token', { principal: { ...principal, type: 'service' }, expiresAt: Date.now() + 60000, generation: 1 });
  await withServer(fixture, async base => {
    const csrfToken = fixture.identityProvider.issueCsrfToken('session-token');
    const sessionHeaders = { 'content-type': 'application/json', cookie: 'beyondbeams_session=session-token', origin: base, 'x-csrf-token': csrfToken };
    const guided = await fetch(`${base}/api/cases`, { method: 'POST', headers: sessionHeaders, body: JSON.stringify({ inputMethod: 'guided', actionType: requestBody.actionType, payload: requestBody.payload, purpose: 'synthetic-test' }) });
    assert.equal(guided.status, 201);
    const created = await guided.json();
    assert.equal(created.authorization.issued, true);
    assert.equal(created.case.state, 'submitted');
    const listed = await fetch(`${base}/api/cases`, { headers: { cookie: 'beyondbeams_session=session-token' } });
    assert.equal((await listed.json()).cases.length, 1);
    const invalidJson = await fetch(`${base}/api/cases`, { method: 'POST', headers: sessionHeaders, body: JSON.stringify({ inputMethod: 'json', actionType: requestBody.actionType, payload: { ...requestBody.payload, unknown: true } }) });
    assert.equal(invalidJson.status, 400);
  });
});

test('wires OIDC session, CSRF, rotation and logout contracts to fail-closed HTTP routes', async t => {
  const fixture = createFixture(t);
  const identityProvider = new SyntheticIdentityProvider();
  fixture.identityProvider = identityProvider;
  let nonce;
  fixture.tokenExchange = ({ code, codeVerifier }) => {
    assert.equal(code, 'synthetic-code');
    assert.ok(codeVerifier.length >= 64);
    return { nonce, principal: { ...principal, type: 'service' } };
  };
  await withServer(fixture, async base => {
    const login = await fetch(`${base}/auth/login?returnTo=%2Fcases`, { redirect: 'manual' });
    assert.equal(login.status, 302);
    const authorization = new URL(login.headers.get('location'));
    nonce = authorization.searchParams.get('nonce');
    const state = authorization.searchParams.get('state');
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');

    const callback = await fetch(`${base}/auth/callback?code=synthetic-code&state=${state}`, { redirect: 'manual' });
    assert.equal(callback.status, 303);
    assert.equal(callback.headers.get('location'), '/cases');
    const cookie = callback.headers.get('set-cookie').split(';')[0];
    assert.match(callback.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
    assert.equal((await fetch(`${base}/auth/callback?code=replay&state=${state}`, { redirect: 'manual' })).status, 401);

    const csrfResponse = await fetch(`${base}/auth/csrf`, { headers: { cookie } });
    const csrfToken = (await csrfResponse.json()).csrfToken;
    const body = JSON.stringify({ inputMethod: 'guided', actionType: requestBody.actionType, payload: requestBody.payload, purpose: 'synthetic-test' });
    assert.equal((await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body })).status, 403);
    assert.equal((await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: base, 'x-csrf-token': `${csrfToken}x` }, body })).status, 403);
    assert.equal((await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: base, 'x-csrf-token': csrfToken }, body })).status, 201);

    const refresh = await fetch(`${base}/auth/session/refresh`, { method: 'POST', headers: { cookie, origin: base, 'x-csrf-token': csrfToken } });
    assert.equal(refresh.status, 204);
    const rotatedCookie = refresh.headers.get('set-cookie').split(';')[0];
    assert.notEqual(rotatedCookie, cookie);
    assert.equal((await fetch(`${base}/auth/csrf`, { headers: { cookie } })).status, 401);
    const rotatedCsrf = (await (await fetch(`${base}/auth/csrf`, { headers: { cookie: rotatedCookie } })).json()).csrfToken;
    const logout = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { cookie: rotatedCookie, origin: base, 'x-csrf-token': rotatedCsrf } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    assert.equal((await fetch(`${base}/auth/csrf`, { headers: { cookie: rotatedCookie } })).status, 401);
  });
});

test('browser authentication routes fail closed without a session provider', async t => {
  const fixture = createFixture(t);
  await withServer(fixture, async base => {
    assert.equal((await fetch(`${base}/auth/callback?code=x&state=${'a'.repeat(32)}`)).status, 503);
    assert.equal((await fetch(`${base}/auth/csrf`, { headers: { Authorization: 'Bearer synthetic-token' } })).status, 400);
  });
});

test('serves the browser shell for all user-facing page routes', async t => {
  const fixture = createFixture(t);
  await withServer(fixture, async base => {
    for (const route of ['/', '/sign-in', '/agents', '/agents/real-time-defense', '/agents/rights-management', '/dashboard', '/cases/new', '/cases/case_synthetic', '/review', '/admin/audit', '/legal/privacy', '/legal/cookies', '/legal/terms']) {
      const response = await fetch(`${base}${route}`);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /<main id="main-content"/);
    }
  });
});

test('protects case detail, queue, assignment, schedule, notes, evidence, and transitions', async t => {
  const fixture = createFixture(t); fixture.identityVerifier = async () => ({ ...principal, roles: ['reviewer', 'administrator'] });
  await withServer(fixture, async base => {
    const headers = { 'content-type': 'application/json', Authorization: 'Bearer synthetic-token' };
    const created = (await (await fetch(`${base}/api/cases`, { method: 'POST', headers, body: JSON.stringify({ inputMethod: 'guided', actionType: requestBody.actionType, payload: requestBody.payload, purpose: 'synthetic-test' }) })).json()).case;
    assert.equal((await fetch(`${base}/api/cases/${created.caseId}`, { headers })).status, 200);
    await fetch(`${base}/api/cases/${created.caseId}/transition`, { method: 'POST', headers, body: JSON.stringify({ target: 'triage' }) });
    assert.equal((await fetch(`${base}/api/cases/${created.caseId}/assign`, { method: 'POST', headers, body: JSON.stringify({ assignedTo: 'reviewer-b', reason: 'coverage' }) })).status, 200);
    assert.equal((await fetch(`${base}/api/cases/${created.caseId}/schedule`, { method: 'POST', headers, body: JSON.stringify({ deadlineAt: '2099-01-01T00:00:00Z', priority: 'high' }) })).status, 200);
    assert.equal((await fetch(`${base}/api/cases/${created.caseId}/notes`, { method: 'POST', headers, body: JSON.stringify({ text: 'Synthetic note', visibility: 'internal' }) })).status, 200);
    assert.equal((await fetch(`${base}/api/cases/${created.caseId}/evidence`, { method: 'POST', headers, body: JSON.stringify({ evidence: { name: 'scan.txt', mediaType: 'text/plain', size: 4, digest: 'a'.repeat(64), storageRef: 'evidence://synthetic/1', scanStatus: 'clean' } }) })).status, 200);
    const queue = await (await fetch(`${base}/api/cases?assignedTo=reviewer-b&priority=high`, { headers })).json();
    assert.equal(queue.cases.length, 1); assert.equal(queue.cases[0].notes.length, 1); assert.equal(queue.cases[0].evidence.length, 1);
  });
});

async function post(base, body, token) {
  return fetch(`${base}/execute`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
}
