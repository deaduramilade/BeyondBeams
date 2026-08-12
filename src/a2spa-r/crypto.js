'use strict';

const crypto = require('crypto');
const { canonicalize } = require('./canonical');
const { fail } = require('./errors');

const ALGORITHM = 'ES256';

function assertAlgorithm(algorithm) {
  if (algorithm !== ALGORITHM) fail('UNSUPPORTED_ALGORITHM', 'only ES256 is permitted by this protocol version');
}

function validateEcKey(key, use) {
  let keyObject;
  try {
    keyObject = use === 'sign' ? crypto.createPrivateKey(key) : crypto.createPublicKey(key);
  } catch {
    fail('INVALID_KEY', `a valid ${use === 'sign' ? 'private' : 'public'} key is required`);
  }
  const details = keyObject.asymmetricKeyDetails || {};
  if (keyObject.asymmetricKeyType !== 'ec' || details.namedCurve !== 'prime256v1') {
    fail('INVALID_KEY', 'ES256 requires a P-256 EC key');
  }
  return keyObject;
}

function signObject(value, privateKey, algorithm = ALGORITHM) {
  assertAlgorithm(algorithm);
  const key = validateEcKey(privateKey, 'sign');
  return crypto.sign('sha256', canonicalize(value), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
}

function verifyObject(value, signature, publicKey, algorithm = ALGORITHM) {
  assertAlgorithm(algorithm);
  if (typeof signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(signature)) return false;
  const key = validateEcKey(publicKey, 'verify');
  try {
    return crypto.verify('sha256', canonicalize(value), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url'));
  } catch {
    return false;
  }
}

module.exports = { ALGORITHM, assertAlgorithm, signObject, verifyObject };