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
const principal = { id: 'service-subject', issuer: 'https://identity.example.invalid', tenantId: 'tenant-a', workloadId: 'workload-a', type: 'service', scopes: ['action:realtime.defense.breach.detect', 'audit:verify', 'audit:export'], tokenId: 'token-1' };
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oblivion-server-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const auditLedger = new AuditLedger({ directory: path.join(root, 'audit') });
  const replayStore = new FileReplayStore({ directory: path.join(root, 'replay') });
  const policyRegistry = new PolicyRegistry({ packs: [policyPack], keyStore: new KeyStore([{ issuer: 'policy-authority.synthetic', keyId: 'policy-key-1', algorithm: 'ES256', publicKey: policyKeys.publicKey }]), active: policyPack });
  const config = {
    authorizationAudience: 'executor.synthetic',
    authorizationKeys: new KeyStore([{ issuer: 'issuer.synthetic', keyId: 'authorization-key-1', algorithm: 'ES256', publicKey: authorizationKeys.publicKey }]),
    authorizationIssuers: ['issuer.synthetic'], policy, deploymentDigest: 'b'.repeat(64), receiptKeyId: 'receipt-key-1',
    corsOrigins: ['https://allowed.example'], bodyLimit: '4kb', rateLimit: 10, rateWindowMs: 60000, clockSkewSeconds: 30, metricsToken: 'synthetic-metrics-token',
    ...overrides.config
  };
  return {
    config, auditLedger, replayStore, policyRegistry,
    signer: overrides.signer || createDevelopmentSigner({ keyId: 'receipt-key-1', privateKey: receiptKeys.privateKey }),
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
    assert.match(await metrics.text(), /oblivion_dependency_ready/);
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

async function post(base, body, token) {
  return fetch(`${base}/execute`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
}