'use strict';

const crypto = require('crypto');

const AUTHORISING_ENTITY = "Samuel F'iyinfoluwa / oceanfi";
const MAX_AGE_MS = 300000;

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashPayload(payload) {
  return crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
}

function signA2SPAPayload(actionType, rawPayload, privateKeyPem, options = {}) {
  const unsignedPayload = {
    actionType,
    payloadHash: hashPayload(rawPayload),
    timestamp: options.timestamp === undefined ? Date.now() : options.timestamp,
    nonce: options.nonce || crypto.randomUUID(),
    authorisingEntity: options.authorisingEntity || AUTHORISING_ENTITY
  };
  const signature = crypto.sign(
    'sha256',
    Buffer.from(canonicalize(unsignedPayload)),
    privateKeyPem
  ).toString('base64');
  return { ...unsignedPayload, signature };
}

function verifyA2SPAPayload(signedPayload, rawPayload, publicKeyPem, options = {}) {
  if (!signedPayload || typeof signedPayload !== 'object' || Array.isArray(signedPayload)) {
    return invalid('malformed_envelope');
  }
  const envelopeFields = ['actionType', 'payloadHash', 'timestamp', 'nonce', 'authorisingEntity', 'signature'];
  if (Object.keys(signedPayload).length !== envelopeFields.length ||
      Object.keys(signedPayload).some(key => !envelopeFields.includes(key))) {
    return invalid('malformed_envelope');
  }
  const { actionType, payloadHash, timestamp, nonce, authorisingEntity, signature } = signedPayload;
  if (![actionType, payloadHash, nonce, authorisingEntity, signature].every(value => typeof value === 'string') ||
      !Number.isFinite(timestamp)) {
    return invalid('malformed_envelope');
  }
  if (authorisingEntity !== (options.authorisingEntity || AUTHORISING_ENTITY)) {
    return invalid('unauthorised_entity');
  }
  const now = options.now === undefined ? Date.now() : options.now;
  const maxAgeMs = options.maxAgeMs || MAX_AGE_MS;
  if (timestamp > now + 30000) return invalid('future_timestamp');
  if (now - timestamp > maxAgeMs) return invalid('expired_timestamp');
  if (payloadHash !== hashPayload(rawPayload)) return invalid('payload_hash_mismatch');

  const unsignedPayload = { actionType, payloadHash, timestamp, nonce, authorisingEntity };
  try {
    return crypto.verify(
      'sha256',
      Buffer.from(canonicalize(unsignedPayload)),
      publicKeyPem,
      Buffer.from(signature, 'base64')
    ) ? { valid: true } : invalid('invalid_signature');
  } catch {
    return invalid('invalid_signature');
  }
}

function authorizeAction(actionType, rawPayload) {
  const signed = signA2SPAPayload(actionType, rawPayload, readPem('OWNER_PRIVATE_KEY'));
  const verification = verifyA2SPAPayload(signed, rawPayload, readPem('OWNER_PUBLIC_KEY'));
  if (!verification.valid) {
    const error = new Error(`A2SPA authorization failed: ${verification.reason}`);
    error.code = 'A2SPA_DENIED';
    throw error;
  }
  return signed;
}

function readPem(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.replace(/\\n/g, '\n');
}

function invalid(reason) {
  return { valid: false, reason };
}

module.exports = {
  AUTHORISING_ENTITY,
  authorizeAction,
  canonicalize,
  hashPayload,
  signA2SPAPayload,
  verifyA2SPAPayload
};