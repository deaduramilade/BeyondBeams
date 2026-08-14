'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { digest } = require('../src/a2spa-r/canonical');
const { issueEnvelope, verifyEnvelope } = require('../src/a2spa-r/envelope');
const { KeyStore } = require('../src/a2spa-r/key-store');
const { FileReplayStore } = require('../src/a2spa-r/replay');
const { issueReceipt, verifyReceipt } = require('../src/a2spa-r/receipt');
const { AuditLedger } = require('../src/audit/ledger');
const { createDevelopmentSigner, ManagedSigner } = require('../src/security/managed-signer');

const keys = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' }
});
const policy = { id: 'policy.synthetic', version: '1.0.0', digest: 'a'.repeat(64) };
const action = 'realtime.defense.breach.detect';
const payload = { breachId: 'SYNTHETIC-1', affectedRecords: 1, dataFlow: 'synthetic' };

function envelope(now, overrides = {}) {
  const context = { action, payloadDigest: digest(payload, 'action-payload'), purpose: 'synthetic-test', retentionClass: 'test-short', legalHold: false, ...overrides.context };
  return issueEnvelope({
    issuer: 'issuer.synthetic', keyId: 'issuer-key-1', tenant: 'tenant-a', workload: 'workload-a', audience: 'executor.synthetic',
    permissions: [action], policy, context, claimsDigest: digest(context, 'authorization-context'), ...overrides
  }, keys.privateKey, new Date(now));
}

function verifyOptions(directory, now, overrides = {}) {
  return {
    audience: 'executor.synthetic', tenant: 'tenant-a', workload: 'workload-a', issuers: ['issuer.synthetic'],
    keyStore: new KeyStore([{ issuer: 'issuer.synthetic', keyId: 'issuer-key-1', algorithm: 'ES256', publicKey: keys.publicKey }]),
    replayStore: new FileReplayStore({ directory, now: () => now }), policyDigest: policy.digest, action,
    payloadDigest: digest(payload, 'action-payload'), clockSkewMs: 0, now, ...overrides
  };
}

test('durably rejects duplicate authorization and allows nonce reuse across tenants', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-replay-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const now = 1700000000000;
  const issued = envelope(now);
  assert.equal(verifyEnvelope(issued, verifyOptions(directory, now)).valid, true);
  assert.equal(verifyEnvelope(issued, verifyOptions(directory, now)).reason, 'REPLAYED_AUTHORIZATION');

  const tenantB = envelope(now, { tenant: 'tenant-b' });
  assert.equal(verifyEnvelope(tenantB, verifyOptions(directory, now, { tenant: 'tenant-b' })).valid, true);
});

test('rejects payload tampering, policy mismatch, unknown and revoked keys, and replay-store failure', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-replay-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const now = 1700000000000;
  assert.equal(verifyEnvelope(envelope(now), verifyOptions(directory, now, { payloadDigest: digest({ changed: true }, 'action-payload') })).reason, 'PAYLOAD_MISMATCH');
  assert.equal(verifyEnvelope(envelope(now), verifyOptions(directory, now, { policyDigest: 'b'.repeat(64) })).reason, 'POLICY_MISMATCH');
  assert.equal(verifyEnvelope(envelope(now), verifyOptions(directory, now, { keyStore: new KeyStore() })).reason, 'UNKNOWN_KEY');
  const revoked = new KeyStore([{ issuer: 'issuer.synthetic', keyId: 'issuer-key-1', algorithm: 'ES256', publicKey: keys.publicKey, revokedAt: new Date(now - 1).toISOString() }]);
  assert.equal(verifyEnvelope(envelope(now), verifyOptions(directory, now, { keyStore: revoked })).reason, 'KEY_REVOKED');
  assert.equal(verifyEnvelope(envelope(now), verifyOptions(directory, now, { replayStore: { consume() { throw new Error('storage detail'); } } })).reason, 'MALFORMED');
});

test('cleans expired replay entries before atomically consuming a nonce', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-replay-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new FileReplayStore({ directory, now: () => 2000 });
  store.consume('expired', 1000);
  store.consume('current', 3000);
  const entries = JSON.parse(fs.readFileSync(path.join(directory, 'nonces.json')));
  assert.equal(Object.keys(entries).length, 1);
});

test('issues and verifies linked signed receipts and fails closed when signer is unavailable', async () => {
  const signer = createDevelopmentSigner({ keyId: 'receipt-key-1', privateKey: keys.privateKey });
  const authorization = envelope(1700000000000);
  const receipt = await issueReceipt({
    requestId: 'request-1', authorization, payload,
    principal: { id: 'actor-a', workloadId: 'workload-a', tenantId: 'tenant-a' }, action,
    deploymentDigest: 'c'.repeat(64), decision: { value: 'permit', reason: 'POLICY_PERMIT' },
    outcome: { status: 'succeeded', code: 'COMPLETED' },
    startedAt: '2023-11-14T22:13:20.000Z', completedAt: '2023-11-14T22:13:21.000Z',
    retention: { class: 'test-short', legalHold: false }
  }, signer);
  const receiptKeys = new KeyStore([{ issuer: 'receipt-service', keyId: 'receipt-key-1', algorithm: 'ES256', publicKey: keys.publicKey }]);
  assert.equal(verifyReceipt(receipt, receiptKeys).valid, true);
  assert.equal(verifyReceipt({ ...receipt, outcome: { status: 'failed', code: 'CHANGED' } }, receiptKeys).reason, 'INVALID_RECEIPT_SIGNATURE');
  const unavailable = new ManagedSigner({ keyId: 'kms-key', sign: async () => '', status: async () => ({ available: false, state: 'disabled' }) });
  await assert.rejects(() => unavailable.sign({ value: true }), { code: 'KEY_SERVICE_UNAVAILABLE' });
});

test('detects audit-chain tampering, isolates exports, logs access, and records retention disposition', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-audit-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const ledger = new AuditLedger({ directory, now: () => 1700000000000 });
  ledger.append('receipt_issued', { tenant: 'tenant-a', receiptId: 'receipt-a', retentionClass: 'test-short', legalHold: false });
  ledger.append('receipt_issued', { tenant: 'tenant-b', receiptId: 'receipt-b', retentionClass: 'test-short', legalHold: false });
  assert.equal(ledger.verify().valid, true);
  assert.equal(ledger.export({ tenantId: 'tenant-a' }).records.length, 1);
  assert.equal(ledger.enforceRetention({ before: '2024-01-01T00:00:00.000Z', classes: ['test-short'] }).physicalDeletion, 'external_approval_required');
  assert.throws(() => ledger.enforceRetention({ before: '2024-01-01T00:00:00.000Z', classes: ['test-short'], legalHold: true }), { code: 'LEGAL_HOLD_ACTIVE' });
  const file = path.join(directory, 'ledger.ndjson');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('receipt-a', 'receipt-x'));
  assert.equal(ledger.verify().reason, 'AUDIT_INTEGRITY_FAILURE');
});
