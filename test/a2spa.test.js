'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const {
  canonicalize,
  hashPayload,
  signA2SPAPayload,
  verifyA2SPAPayload
} = require('../src/a2spa-crypto/A2SPA');

const keys = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' }
});
const otherKeys = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' }
});
const payload = { nested: { b: 2, a: 1 }, value: 'synthetic' };
const now = 1700000000000;

test('canonicalization and hashes are stable across object key order', () => {
  assert.equal(canonicalize({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.equal(hashPayload({ b: 2, a: 1 }), hashPayload({ a: 1, b: 2 }));
});

test('signs and verifies an envelope bound to its payload', () => {
  const signed = signA2SPAPayload('example.action', payload, keys.privateKey, { timestamp: now, nonce: 'test-nonce' });
  assert.deepEqual(verifyA2SPAPayload(signed, payload, keys.publicKey, { now }), { valid: true });
  assert.equal(verifyA2SPAPayload(signed, { changed: true }, keys.publicKey, { now }).reason, 'payload_hash_mismatch');
});

test('rejects expired, future, malformed, and incorrectly signed envelopes', () => {
  const signed = signA2SPAPayload('example.action', payload, keys.privateKey, { timestamp: now, nonce: 'test-nonce' });
  assert.equal(verifyA2SPAPayload(signed, payload, keys.publicKey, { now: now + 300001 }).reason, 'expired_timestamp');
  assert.equal(verifyA2SPAPayload(signed, payload, keys.publicKey, { now: now - 30001 }).reason, 'future_timestamp');
  assert.equal(verifyA2SPAPayload(signed, payload, otherKeys.publicKey, { now }).reason, 'invalid_signature');
  assert.equal(verifyA2SPAPayload({}, payload, keys.publicKey, { now }).reason, 'malformed_envelope');
});