'use strict';

const { assertAlgorithm } = require('./crypto');
const { fail } = require('./errors');
const { identifier, timestamp } = require('./validation');

class KeyStore {
  constructor(records = []) {
    this.records = new Map();
    for (const record of records) this.add(record);
  }

  add(record) {
    if (!record || typeof record !== 'object') fail('INVALID_KEY_RECORD', 'key record is required');
    identifier(record.issuer, 'key issuer');
    identifier(record.keyId, 'key identifier');
    assertAlgorithm(record.algorithm);
    if (!record.publicKey) fail('INVALID_KEY_RECORD', 'public key is required');
    const mapKey = `${record.issuer}\0${record.keyId}`;
    if (this.records.has(mapKey)) fail('DUPLICATE_KEY', 'issuer and key identifier must be unique');
    const notBefore = record.notBefore ? timestamp(record.notBefore, 'key notBefore') : null;
    const notAfter = record.notAfter ? timestamp(record.notAfter, 'key notAfter') : null;
    const revokedAt = record.revokedAt ? timestamp(record.revokedAt, 'key revokedAt') : null;
    if (notBefore !== null && notAfter !== null && notBefore >= notAfter) fail('INVALID_KEY_RECORD', 'key validity interval is invalid');
    this.records.set(mapKey, Object.freeze({ ...record, notBefore, notAfter, revokedAt }));
  }

  resolve(issuer, keyId, algorithm, signedAt) {
    assertAlgorithm(algorithm);
    const record = this.records.get(`${issuer}\0${keyId}`);
    if (!record) fail('UNKNOWN_KEY', 'verification key was not found');
    if (record.algorithm !== algorithm) fail('ALGORITHM_MISMATCH', 'key algorithm does not match the signed object');
    if ((record.notBefore !== null && signedAt < record.notBefore) || (record.notAfter !== null && signedAt > record.notAfter)) {
      fail('KEY_NOT_VALID', 'key was not valid at signing time');
    }
    if (record.revokedAt !== null && signedAt >= record.revokedAt) fail('KEY_REVOKED', 'key was revoked at signing time');
    return record.publicKey;
  }
}

module.exports = { KeyStore };