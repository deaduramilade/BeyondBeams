'use strict';

const crypto = require('crypto');
const { digest } = require('./canonical');
const { ALGORITHM, signObject, verifyObject } = require('./crypto');
const { fail } = require('./errors');
const { validateIdentityBinding } = require('./identity');
const { base64url, exactObject, identifier, stringArray, timestamp } = require('./validation');

const PROTOCOL = 'A2SPA-R/1';
const ENVELOPE_FIELDS = ['protocol', 'algorithm', 'issuer', 'keyId', 'tenant', 'workload', 'audience', 'permissions', 'policy', 'issuedAt', 'expiresAt', 'nonce', 'context', 'claimsDigest', 'signature'];
const POLICY_FIELDS = ['id', 'version', 'digest'];

function issueEnvelope(input, privateKey, now = new Date()) {
  const issuedAt = now.toISOString();
  const expiresAt = input.expiresAt || new Date(now.getTime() + 300000).toISOString();
  const unsigned = normalizeEnvelope({ ...input, protocol: PROTOCOL, algorithm: ALGORITHM, issuedAt, expiresAt, nonce: input.nonce || crypto.randomBytes(32).toString('base64url') });
  return { ...unsigned, signature: signObject(unsigned, privateKey) };
}

function verifyEnvelope(envelope, options) {
  try {
    exactObject(envelope, ENVELOPE_FIELDS, 'envelope');
    const normalized = normalizeEnvelope(envelope);
    if (normalized.protocol !== PROTOCOL) fail('UNSUPPORTED_PROTOCOL', 'authorization protocol version is not supported');
    const issued = timestamp(normalized.issuedAt, 'issuedAt');
    const expires = timestamp(normalized.expiresAt, 'expiresAt');
    const now = options.now === undefined ? Date.now() : options.now;
    if (issued > now + options.clockSkewMs) fail('NOT_YET_VALID', 'authorization is from the future');
    if (expires <= now - options.clockSkewMs) fail('EXPIRED_AUTHORIZATION', 'authorization has expired');
    if (expires <= issued) fail('INVALID_VALIDITY', 'authorization validity period is invalid');
    validateIdentityBinding(normalized, options);
    const publicKey = options.keyStore.resolve(normalized.issuer, normalized.keyId, normalized.algorithm, issued);
    if (!verifyObject(unsignedEnvelope(normalized), normalized.signature, publicKey, normalized.algorithm)) fail('INVALID_SIGNATURE', 'authorization signature is invalid');
    if (options.policyDigest !== normalized.policy.digest) fail('POLICY_MISMATCH', 'authorization policy does not match the active policy');
    const expectedClaimsDigest = digest(normalized.context, 'authorization-context');
    if (expectedClaimsDigest !== normalized.claimsDigest) fail('CONTEXT_MISMATCH', 'authorization context digest is invalid');
    if (options.action && !normalized.permissions.includes(options.action)) fail('ACTION_NOT_AUTHORIZED', 'authorization does not permit this action');
    if (options.action && normalized.context.action !== options.action) fail('ACTION_MISMATCH', 'authorization action does not match the request');
    if (options.payloadDigest && normalized.context.payloadDigest !== options.payloadDigest) fail('PAYLOAD_MISMATCH', 'authorization payload does not match the request');
    options.replayStore.consume(`${normalized.tenant}\0${normalized.issuer}\0${normalized.nonce}`, expires);
    return { valid: true, envelope: normalized };
  } catch (error) {
    if (error.code) return { valid: false, reason: error.code };
    return { valid: false, reason: 'MALFORMED' };
  }
}

function normalizeEnvelope(value) {
  exactObject(value.policy, POLICY_FIELDS, 'policy');
  identifier(value.issuer, 'issuer'); identifier(value.keyId, 'keyId'); identifier(value.tenant, 'tenant'); identifier(value.workload, 'workload'); identifier(value.audience, 'audience');
  if (value.protocol !== PROTOCOL) fail('UNSUPPORTED_PROTOCOL', 'authorization protocol version is not supported');
  if (value.algorithm !== ALGORITHM) fail('UNSUPPORTED_ALGORITHM', 'authorization algorithm is not supported');
  stringArray(value.permissions, 'permissions');
  identifier(value.policy.id, 'policy.id'); identifier(value.policy.version, 'policy.version');
  if (!/^[0-9a-f]{64}$/.test(value.policy.digest)) fail('MALFORMED', 'policy.digest is invalid');
  timestamp(value.issuedAt, 'issuedAt'); timestamp(value.expiresAt, 'expiresAt');
  base64url(value.nonce, 'nonce', 32);
  if (!value.context || typeof value.context !== 'object' || Array.isArray(value.context)) fail('MALFORMED', 'context is invalid');
  if (!/^[0-9a-f]{64}$/.test(value.claimsDigest)) fail('MALFORMED', 'claimsDigest is invalid');
  return value;
}

function unsignedEnvelope(envelope) { const { signature, ...unsigned } = envelope; return unsigned; }

module.exports = { ENVELOPE_FIELDS, PROTOCOL, issueEnvelope, verifyEnvelope, unsignedEnvelope };