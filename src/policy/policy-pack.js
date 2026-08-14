'use strict';

const crypto = require('crypto');
const { digest } = require('../a2spa-r/canonical');
const { ALGORITHM, signObject, verifyObject } = require('../a2spa-r/crypto');
const { exactObject, identifier, stringArray, timestamp } = require('../a2spa-r/validation');

const SCHEMA = 'beyondbeams.policy-pack/1';
const PACK_FIELDS = ['schema', 'id', 'version', 'publisher', 'keyId', 'algorithm', 'institution', 'jurisdiction', 'publishedAt', 'effectiveAt', 'expiresAt', 'supersedes', 'approvals', 'rules', 'signature'];
const RULE_FIELDS = ['id', 'effect', 'actions', 'purposes', 'principalTypes', 'humanApproval', 'rights'];
const APPROVAL_FIELDS = ['role', 'approver', 'approvedAt'];
const HUMAN_FIELDS = ['required', 'roles'];
const RIGHTS_FIELDS = ['notice', 'humanReview', 'appeal', 'remedy'];
const APPROVAL_ROLES = ['policy-owner', 'legal-rights', 'security'];

function issuePolicyPack(input, privateKey) {
  const unsigned = normalizePack({ ...input, schema: SCHEMA, algorithm: ALGORITHM });
  return { ...unsigned, signature: signObject(unsigned, privateKey) };
}

function policyDigest(pack) {
  return digest(unsignedPack(pack), 'policy-pack');
}

function verifyPolicyPack(pack, keyStore, now = Date.now()) {
  try {
    exactObject(pack, PACK_FIELDS, 'policy pack');
    const unsigned = normalizePack(unsignedPack(pack));
    const publishedAt = timestamp(unsigned.publishedAt, 'publishedAt');
    const effectiveAt = timestamp(unsigned.effectiveAt, 'effectiveAt');
    const expiresAt = timestamp(unsigned.expiresAt, 'expiresAt');
    if (publishedAt > effectiveAt || effectiveAt >= expiresAt || now >= expiresAt) return invalid('POLICY_EXPIRED');
    const publicKey = keyStore.resolve(unsigned.publisher, unsigned.keyId, unsigned.algorithm, publishedAt);
    if (!verifyObject(unsigned, pack.signature, publicKey, unsigned.algorithm)) return invalid('INVALID_POLICY_SIGNATURE');
    return { valid: true, pack: Object.freeze({ ...unsigned, signature: pack.signature }), digest: policyDigest(pack) };
  } catch (error) {
    return invalid(error.code || 'MALFORMED_POLICY');
  }
}

class PolicyRegistry {
  constructor({ packs, keyStore, active, revoked = [], now = Date.now }) {
    this.now = now;
    this.keyStore = keyStore;
    this.packs = new Map();
    this.revoked = new Map(revoked.map(record => [policyKey(record.id, record.version), record]));
    for (const pack of packs || []) this.publish(pack);
    this.activate(active.id, active.version);
  }

  publish(pack) {
    const verification = verifyPolicyPack(pack, this.keyStore, this.now());
    if (!verification.valid) throw policyError(verification.reason);
    const key = policyKey(pack.id, pack.version);
    if (this.packs.has(key)) throw policyError('DUPLICATE_POLICY');
    this.packs.set(key, verification);
    return verification.digest;
  }

  activate(id, version) {
    const candidate = this.packs.get(policyKey(id, version));
    if (!candidate) throw policyError('UNKNOWN_POLICY');
    if (this.revoked.has(policyKey(id, version))) throw policyError('POLICY_REVOKED');
    if (this.now() < Date.parse(candidate.pack.effectiveAt)) throw policyError('POLICY_NOT_EFFECTIVE');
    this.active = candidate;
    return this.status();
  }

  revoke(id, version, reason = 'POLICY_REVOKED') {
    identifier(reason, 'revocation reason');
    const key = policyKey(id, version);
    if (!this.packs.has(key)) throw policyError('UNKNOWN_POLICY');
    this.revoked.set(key, { id, version, reason, revokedAt: new Date(this.now()).toISOString() });
  }

  rollback(id, version) {
    return this.activate(id, version);
  }

  status() {
    const pack = this.active && this.active.pack;
    const revoked = pack && this.revoked.get(policyKey(pack.id, pack.version));
    return { ready: Boolean(pack && !revoked && this.now() < Date.parse(pack.expiresAt)), id: pack && pack.id, version: pack && pack.version, digest: this.active && this.active.digest, reason: revoked && revoked.reason };
  }

  decide({ principal, action, context }) {
    const decisionId = crypto.randomUUID();
    const status = this.status();
    if (!status.ready) return deny(decisionId, status.reason || 'POLICY_UNAVAILABLE', status);
    const pack = this.active.pack;
    if (!context || context.institution !== pack.institution) return deny(decisionId, 'INSTITUTION_MISMATCH', status);
    if (context.jurisdiction !== pack.jurisdiction) return deny(decisionId, 'JURISDICTION_MISMATCH', status);
    if (typeof context.purpose !== 'string') return deny(decisionId, 'PURPOSE_REQUIRED', status);
    const prohibited = pack.rules.find(rule => rule.effect === 'deny' && matches(rule, principal, action, context.purpose));
    if (prohibited) return deny(decisionId, 'PROHIBITED_ACTION', status, prohibited);
    const rule = pack.rules.find(candidate => candidate.effect === 'permit' && matches(candidate, principal, action, context.purpose));
    if (!rule) return deny(decisionId, 'NO_APPLICABLE_RULE', status);
    if (rule.humanApproval.required) {
      if (!validHumanApproval(context.humanApproval, rule.humanApproval.roles)) return deny(decisionId, 'HUMAN_APPROVAL_REQUIRED', status, rule);
      if (context.humanApproval.approver === principal.id) return deny(decisionId, 'SELF_APPROVAL_PROHIBITED', status, rule);
    }
    return { value: 'permit', reason: 'POLICY_PERMIT', decisionId, ruleId: rule.id, policy: status, rights: rule.rights };
  }
}

function normalizePack(value) {
  if (value.schema !== SCHEMA || value.algorithm !== ALGORITHM) throw policyError('UNSUPPORTED_POLICY_FORMAT');
  ['id', 'version', 'publisher', 'keyId', 'institution', 'jurisdiction'].forEach(field => identifier(value[field], field));
  timestamp(value.publishedAt, 'publishedAt'); timestamp(value.effectiveAt, 'effectiveAt'); timestamp(value.expiresAt, 'expiresAt');
  if (value.supersedes !== null) identifier(value.supersedes, 'supersedes');
  if (!Array.isArray(value.approvals) || value.approvals.length < 2) throw policyError('POLICY_APPROVAL_REQUIRED');
  const roles = new Set();
  for (const approval of value.approvals) {
    exactObject(approval, APPROVAL_FIELDS, 'policy approval');
    if (!APPROVAL_ROLES.includes(approval.role) || roles.has(approval.role)) throw policyError('INVALID_POLICY_APPROVAL');
    roles.add(approval.role); identifier(approval.approver, 'approver'); timestamp(approval.approvedAt, 'approvedAt');
  }
  if (!roles.has('policy-owner') || !roles.has('legal-rights')) throw policyError('POLICY_APPROVAL_REQUIRED');
  if (!Array.isArray(value.rules) || value.rules.length === 0 || value.rules.length > 256) throw policyError('INVALID_POLICY_RULES');
  const ruleIds = new Set();
  for (const rule of value.rules) validateRule(rule, ruleIds);
  return value;
}

function validateRule(rule, ruleIds) {
  exactObject(rule, RULE_FIELDS, 'policy rule');
  identifier(rule.id, 'rule id');
  if (ruleIds.has(rule.id)) throw policyError('DUPLICATE_POLICY_RULE');
  ruleIds.add(rule.id);
  if (!['permit', 'deny'].includes(rule.effect)) throw policyError('INVALID_POLICY_RULES');
  stringArray(rule.actions, 'rule actions'); stringArray(rule.purposes, 'rule purposes');
  stringArray(rule.principalTypes, 'rule principal types');
  if (rule.principalTypes.some(type => !['human', 'service', 'agent'].includes(type))) throw policyError('INVALID_POLICY_RULES');
  exactObject(rule.humanApproval, HUMAN_FIELDS, 'human approval rule');
  if (typeof rule.humanApproval.required !== 'boolean' || !Array.isArray(rule.humanApproval.roles) ||
      rule.humanApproval.roles.some(role => typeof role !== 'string')) throw policyError('INVALID_POLICY_RULES');
  if (rule.humanApproval.required) stringArray(rule.humanApproval.roles, 'human approval roles');
  exactObject(rule.rights, RIGHTS_FIELDS, 'rights rule');
  for (const value of Object.values(rule.rights)) if (typeof value !== 'boolean') throw policyError('INVALID_POLICY_RULES');
  if (rule.effect === 'permit' && (!rule.rights.humanReview || !rule.rights.appeal || !rule.rights.remedy)) throw policyError('RIGHTS_RULE_REQUIRED');
}

function matches(rule, principal, action, purpose) {
  return rule.actions.includes(action) && rule.purposes.includes(purpose) && rule.principalTypes.includes(principal.type);
}

function validHumanApproval(approval, roles) {
  if (!approval || approval.decision !== 'approved' || !roles.includes(approval.role)) return false;
  try {
    exactObject(approval, ['decision', 'role', 'approver', 'approvedAt'], 'human approval');
    identifier(approval.approver, 'human approver');
    identifier(approval.role, 'human approval role');
    timestamp(approval.approvedAt, 'human approval time');
    return true;
  } catch { return false; }
}

function deny(decisionId, reason, policy, rule) {
  return { value: 'deny', reason, decisionId, ...(rule ? { ruleId: rule.id } : {}), policy };
}

function unsignedPack(pack) { const { signature, ...unsigned } = pack; return unsigned; }
function policyKey(id, version) { return `${id}\0${version}`; }
function invalid(reason) { return { valid: false, reason }; }
function policyError(code) { const error = new Error('policy operation failed'); error.code = code; return error; }

module.exports = { PolicyRegistry, SCHEMA, issuePolicyPack, policyDigest, verifyPolicyPack };
