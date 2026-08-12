'use strict';

const crypto = require('crypto');
const { digest, HEX_256, SERIALIZATION } = require('./canonical');
const { ALGORITHM, verifyObject } = require('./crypto');
const { exactObject, identifier, timestamp } = require('./validation');
const { fail } = require('./errors');

const RECEIPT_PROTOCOL = 'A2SPA-R-RECEIPT/1';
const RECEIPT_FIELDS = ['protocol', 'serialization', 'algorithm', 'keyId', 'receiptId', 'requestId', 'authorizationDigest', 'payloadDigest', 'claimsDigest', 'policy', 'deploymentDigest', 'actor', 'workload', 'tenant', 'action', 'decision', 'outcome', 'startedAt', 'completedAt', 'retention', 'signature'];

async function issueReceipt(input, signer) {
  const unsigned = {
    protocol: RECEIPT_PROTOCOL,
    serialization: SERIALIZATION,
    algorithm: signer.algorithm,
    keyId: signer.keyId,
    receiptId: input.receiptId || crypto.randomUUID(),
    requestId: input.requestId,
    authorizationDigest: digest(input.authorization, 'authorization-envelope'),
    payloadDigest: digest(input.payload, 'action-payload'),
    claimsDigest: digest(input.authorization.context, 'authorization-context'),
    policy: { id: input.authorization.policy.id, version: input.authorization.policy.version, digest: input.authorization.policy.digest },
    deploymentDigest: input.deploymentDigest,
    actor: input.principal.id,
    workload: input.principal.workloadId,
    tenant: input.principal.tenantId,
    action: input.action,
    decision: input.decision,
    outcome: input.outcome,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    retention: input.retention
  };
  validateUnsigned(unsigned);
  return { ...unsigned, signature: await signer.sign(unsigned) };
}

function verifyReceipt(receipt, keyStore) {
  try {
    exactObject(receipt, RECEIPT_FIELDS, 'receipt');
    const unsigned = unsignedReceipt(receipt);
    validateUnsigned(unsigned);
    const signedAt = timestamp(receipt.completedAt, 'completedAt');
    const publicKey = keyStore.resolve('receipt-service', receipt.keyId, receipt.algorithm, signedAt);
    if (!verifyObject(unsigned, receipt.signature, publicKey, receipt.algorithm)) fail('INVALID_RECEIPT_SIGNATURE', 'receipt signature is invalid');
    return { valid: true, digest: digest(receipt, 'signed-receipt') };
  } catch (error) { return { valid: false, reason: error.code || 'MALFORMED' }; }
}

function validateUnsigned(value) {
  if (value.protocol !== RECEIPT_PROTOCOL || value.serialization !== SERIALIZATION || value.algorithm !== ALGORITHM) fail('MALFORMED', 'receipt protocol is invalid');
  ['keyId', 'receiptId', 'requestId', 'actor', 'workload', 'tenant', 'action'].forEach(field => identifier(value[field], field));
  ['authorizationDigest', 'payloadDigest', 'claimsDigest', 'deploymentDigest'].forEach(field => { if (!HEX_256.test(value[field])) fail('MALFORMED', `${field} is invalid`); });
  if (!value.policy || !HEX_256.test(value.policy.digest)) fail('MALFORMED', 'policy is invalid');
  identifier(value.policy.id, 'policy.id'); identifier(value.policy.version, 'policy.version');
  if (!value.decision || !['permit', 'deny'].includes(value.decision.value)) fail('MALFORMED', 'decision is invalid');
  identifier(value.decision.reason, 'decision.reason');
  if (!value.outcome || !['succeeded', 'failed', 'not_executed'].includes(value.outcome.status)) fail('MALFORMED', 'outcome is invalid');
  identifier(value.outcome.code, 'outcome.code');
  const started = timestamp(value.startedAt, 'startedAt');
  const completed = timestamp(value.completedAt, 'completedAt');
  if (completed < started) fail('MALFORMED', 'receipt timing is invalid');
  if (!value.retention || typeof value.retention.class !== 'string' || typeof value.retention.legalHold !== 'boolean') fail('MALFORMED', 'retention is invalid');
  identifier(value.retention.class, 'retention.class');
}

function unsignedReceipt(receipt) { const { signature, ...unsigned } = receipt; return unsigned; }

module.exports = { RECEIPT_PROTOCOL, issueReceipt, verifyReceipt, unsignedReceipt };