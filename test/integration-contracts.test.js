'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { REQUIRED_CONTRACTS, validateProviderContracts } = require('../src/integrations/contracts');
const { createSyntheticPlatform } = require('../src/integrations/synthetic-platform');

test('synthetic platform implements every provider-neutral contract', () => {
  const platform = createSyntheticPlatform();
  assert.equal(validateProviderContracts(platform), true);
  for (const [name, methods] of Object.entries(REQUIRED_CONTRACTS)) for (const method of methods) assert.equal(typeof platform[name][method], 'function');
  assert.throws(() => validateProviderContracts({}), { code: 'INVALID_IDENTITY_PROVIDER' });
});

test('synthetic OIDC lifecycle consumes state and nonce, uses PKCE, rotates sessions, verifies CSRF, logs out, and revokes', () => {
  let now = 1700000000000;
  const identity = createSyntheticPlatform({ identity: { now: () => now } }).identity;
  const started = identity.beginAuthorization({ returnTo: '/cases' });
  const url = new URL(started.authorizationUrl);
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  const nonce = url.searchParams.get('nonce');
  const session = identity.completeAuthorization({ state: started.state, code: 'synthetic-code', exchange: input => {
    assert.equal(typeof input.codeVerifier, 'string');
    return { nonce, principal: { id: 'person.synthetic', tenantId: 'tenant.synthetic', workloadId: 'browser.synthetic', type: 'human' } };
  } });
  assert.equal(identity.authenticateSession(session.sessionId).id, 'person.synthetic');
  assert.throws(() => identity.completeAuthorization({ state: started.state, code: 'replay', exchange() {} }), { code: 'INVALID_OIDC_STATE' });
  const csrf = identity.issueCsrfToken(session.sessionId);
  assert.equal(identity.verifyCsrfToken(session.sessionId, csrf), true);
  assert.throws(() => identity.verifyCsrfToken(session.sessionId, `${csrf}x`), { code: 'INVALID_CSRF_TOKEN' });
  const rotated = identity.rotateSession(session.sessionId);
  assert.throws(() => identity.authenticateSession(session.sessionId), { code: 'INVALID_SESSION' });
  assert.equal(identity.logout(rotated.sessionId).localSessionRevoked, true);
  assert.throws(() => identity.authenticateSession(rotated.sessionId), { code: 'INVALID_SESSION' });
  now += 301000;
  const expired = identity.beginAuthorization(); now += 301000;
  assert.throws(() => identity.completeAuthorization({ state: expired.state, code: 'late', exchange() {} }), { code: 'INVALID_OIDC_STATE' });
});

test('synthetic key custody, transaction/outbox, migration, backup and restore contracts fail safely', () => {
  const platform = createSyntheticPlatform();
  const key = platform.signer.rotate();
  assert.match(platform.signer.sign({ keyId: key.keyId, value: { synthetic: true } }).signature, /^[A-Za-z0-9_-]{86}$/);
  platform.signer.revoke(key.keyId);
  assert.throws(() => platform.signer.sign({ keyId: key.keyId, value: {} }), { code: 'KEY_UNAVAILABLE' });
  platform.persistence.transaction(tx => { tx.records.case1 = { state: 'submitted' }; tx.outbox.push({ type: 'notify', caseId: 'case1' }); });
  const backup = platform.persistence.backup();
  platform.persistence.transaction(tx => { tx.records.case1.state = 'closed'; });
  assert.equal(platform.persistence.restore(backup.id).restored, true);
  assert.equal(platform.persistence.read('case1').state, 'submitted');
  assert.equal(platform.persistence.migrate(2, tx => { tx.records.schema = 2; }).version, 2);
});

test('synthetic queue, immutable records, scanning, retention and legal hold contracts are deterministic', () => {
  let now = 1700000000000;
  const platform = createSyntheticPlatform({ records: { now: () => now }, queue: { maxAttempts: 1 } });
  const queued = platform.queue.enqueue({ idempotencyKey: 'case1:notice', reference: 'case1' });
  assert.equal(platform.queue.enqueue({ idempotencyKey: 'case1:notice' }).duplicate, true);
  assert.equal(platform.queue.fail(platform.queue.lease('worker.synthetic').id, 'PROVIDER_DOWN').state, 'dead-letter');
  assert.equal(platform.queue.health().deadLetter, 1);
  const record = platform.records.putImmutable({ tenant: 'tenant.synthetic', content: Buffer.from('safe synthetic file'), mediaType: 'text/plain', retentionUntil: new Date(now + 1000).toISOString() });
  assert.equal(record.scan.status, 'clean');
  assert.throws(() => platform.records.putImmutable({ tenant: 'tenant.synthetic', content: Buffer.from('SYNTHETIC-MALWARE'), mediaType: 'text/plain', retentionUntil: new Date(now + 1000).toISOString() }), { code: 'MALWARE_REJECTED' });
  platform.records.placeLegalHold('tenant.synthetic', record.id, true); now += 2000;
  assert.equal(platform.records.deleteExpired(), 0);
  platform.records.placeLegalHold('tenant.synthetic', record.id, false);
  assert.equal(platform.records.deleteExpired(), 1);
});

test('synthetic notifications, documents, policy and telemetry produce bounded acceptance artifacts', () => {
  const platform = createSyntheticPlatform({ telemetry: { clock: () => 1005, alertRules: [{ code: 'CLOCK_DRIFT', severity: 'high', runbook: 'RUNBOOK.md#time', test: measures => Math.abs(measures.get('clock_offset_ms')) > 2 }] } });
  const delivery = platform.notifications.send({ tenant: 'tenant.synthetic', template: 'notice.v1', locale: 'en', destinationRef: 'synthetic@example.invalid', idempotencyKey: 'notice-1' });
  assert.equal(platform.notifications.receipt(delivery.deliveryId).status, 'delivered');
  assert.equal(platform.notifications.send({ tenant: 'tenant.synthetic', template: 'notice.v1', locale: 'en', destinationRef: 'synthetic@example.invalid', idempotencyKey: 'notice-1' }).duplicate, true);
  const generated = platform.documents.generate({ title: 'Synthetic notice', language: 'en', sections: [{ heading: 'Outcome', body: 'Synthetic only' }] });
  assert.deepEqual(platform.documents.validateAccessibility(generated), { valid: true, findings: [], scope: 'structural-synthetic-check-only' });
  platform.policy.publish({ id: 'synthetic-policy', version: '1' }); platform.policy.activate('synthetic-policy', '1');
  assert.equal(platform.policy.status().ready, true); platform.policy.revoke('synthetic-policy', '1'); assert.equal(platform.policy.status().ready, false);
  assert.equal(platform.telemetry.measureClock(1000).synchronized, true);
  assert.equal(platform.telemetry.evaluateAlerts()[0].code, 'CLOCK_DRIFT');
  assert.throws(() => platform.telemetry.emit({ event: 'bad', token: 'secret' }), { code: 'SENSITIVE_TELEMETRY_REJECTED' });
});