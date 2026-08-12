'use strict';

const { ALGORITHM, signObject } = require('../a2spa-r/crypto');
const { identifier } = require('../a2spa-r/validation');

class ManagedSigner {
  constructor({ keyId, algorithm = ALGORITHM, sign, status = async () => ({ available: true, state: 'active' }) }) {
    identifier(keyId, 'signing key identifier');
    if (algorithm !== ALGORITHM || typeof sign !== 'function' || typeof status !== 'function') throw new Error('invalid managed signer configuration');
    this.keyId = keyId;
    this.algorithm = algorithm;
    this.signOperation = sign;
    this.statusOperation = status;
  }

  async readiness() {
    try {
      const result = await this.statusOperation(this.keyId);
      return Boolean(result && result.available && result.state === 'active');
    } catch { return false; }
  }

  async sign(value) {
    if (!await this.readiness()) throw signerError('KEY_SERVICE_UNAVAILABLE');
    try {
      const signature = await this.signOperation({ keyId: this.keyId, algorithm: this.algorithm, value });
      if (typeof signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(signature)) throw new Error();
      return signature;
    } catch (error) {
      if (error.code === 'KEY_SERVICE_UNAVAILABLE') throw error;
      throw signerError('SIGNING_FAILED');
    }
  }
}

function createDevelopmentSigner({ keyId, privateKey }) {
  return new ManagedSigner({ keyId, sign: async ({ value }) => signObject(value, privateKey) });
}

function signerError(code) {
  const error = new Error('managed signing operation failed');
  error.code = code;
  return error;
}

module.exports = { ManagedSigner, createDevelopmentSigner };