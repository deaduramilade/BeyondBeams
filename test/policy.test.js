'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { KeyStore } = require('../src/a2spa-r/key-store');
const { PolicyRegistry, issuePolicyPack, policyDigest, verifyPolicyPack } = require('../src/policy/policy-pack');

const keys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const now = Date.parse('2026-01-02T00:00:00.000Z');
const trust = new KeyStore([{ issuer: 'policy-authority.synthetic', keyId: 'policy-key-1', algorithm: 'ES256', publicKey: keys.publicKey }]);

function pack(overrides = {}) {
  return issuePolicyPack({
    id: 'policy.synthetic', version: '1.0.0', publisher: 'policy-authority.synthetic', keyId: 'policy-key-1',
    institution: 'institution.synthetic', jurisdiction: 'jurisdiction.synthetic', publishedAt: '2026-01-01T00:00:00.000Z',
    effectiveAt: '2026-01-01T01:00:00.000Z', expiresAt: '2027-01-01T00:00:00.000Z', supersedes: null,
    approvals: [
      { role: 'policy-owner', approver: 'owner.synthetic', approvedAt: '2026-01-01T00:10:00.000Z' },
      { role: 'legal-rights', approver: 'rights.synthetic', approvedAt: '2026-01-01T00:20:00.000Z' }
    ],
    rules: [
      { id: 'deny-prohibited', effect: 'deny', actions: ['rights.management.exercise'], purposes: ['prohibited-purpose'], principalTypes: ['human', 'service', 'agent'], humanApproval: { required: false, roles: [] }, rights: { notice: true, humanReview: true, appeal: true, remedy: true } },
      { id: 'permit-breach', effect: 'permit', actions: ['realtime.defense.breach.detect'], purposes: ['incident-response'], principalTypes: ['service'], humanApproval: { required: true, roles: ['incident-commander'] }, rights: { notice: true, humanReview: true, appeal: true, remedy: true } }
    ], ...overrides
  }, keys.privateKey);
}

function request(overrides = {}) {
  return { principal: { type: 'service' }, action: 'realtime.defense.breach.detect', context: { institution: 'institution.synthetic', jurisdiction: 'jurisdiction.synthetic', purpose: 'incident-response', humanApproval: { decision: 'approved', role: 'incident-commander', approver: 'approver.synthetic', approvedAt: '2026-01-01T23:00:00.000Z' }, ...overrides } };
}

test('verifies publication signature and stable policy digest', () => {
  const signed = pack();
  const verified = verifyPolicyPack(signed, trust, now);
  assert.equal(verified.valid, true);
  assert.equal(verified.digest, policyDigest(signed));
  assert.equal(verifyPolicyPack({ ...signed, jurisdiction: 'changed' }, trust, now).reason, 'INVALID_POLICY_SIGNATURE');
});

test('enforces binding, purpose, prohibitions, human approval, and rights', () => {
  const signed = pack();
  const registry = new PolicyRegistry({ packs: [signed], keyStore: trust, active: signed, now: () => now });
  const permitted = registry.decide(request());
  assert.equal(permitted.value, 'permit');
  assert.equal(permitted.rights.appeal, true);
  assert.equal(registry.decide(request({ jurisdiction: 'other' })).reason, 'JURISDICTION_MISMATCH');
  assert.equal(registry.decide(request({ purpose: 'other' })).reason, 'NO_APPLICABLE_RULE');
  assert.equal(registry.decide(request({ humanApproval: null })).reason, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(registry.decide({ ...request(), principal: { type: 'service', id: 'approver.synthetic' } }).reason, 'SELF_APPROVAL_PROHIBITED');
  assert.equal(registry.decide(request({ humanApproval: { decision: 'approved', role: 'incident-commander', approver: 'approver.synthetic', approvedAt: '2026-01-01T23:00:00.000Z', extra: true } })).reason, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(registry.decide({ principal: { type: 'service' }, action: 'rights.management.exercise', context: { institution: 'institution.synthetic', jurisdiction: 'jurisdiction.synthetic', purpose: 'prohibited-purpose' } }).reason, 'PROHIBITED_ACTION');
});

test('supports revocation and controlled rollback to a published version', () => {
  const first = pack();
  const second = pack({ version: '1.1.0', supersedes: 'policy.synthetic@1.0.0' });
  const registry = new PolicyRegistry({ packs: [first, second], keyStore: trust, active: second, now: () => now });
  registry.revoke('policy.synthetic', '1.1.0', 'unsafe-policy');
  assert.equal(registry.status().ready, false);
  registry.rollback('policy.synthetic', '1.0.0');
  assert.equal(registry.status().version, '1.0.0');
});