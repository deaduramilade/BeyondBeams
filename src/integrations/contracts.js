'use strict';

const REQUIRED_CONTRACTS = Object.freeze({
  identity: ['beginAuthorization', 'completeAuthorization', 'authenticateSession', 'rotateSession', 'issueCsrfToken', 'verifyCsrfToken', 'logout', 'revoke'],
  signer: ['status', 'sign', 'rotate', 'revoke'],
  persistence: ['transaction', 'read', 'backup', 'restore', 'migrate'],
  queue: ['enqueue', 'lease', 'acknowledge', 'fail', 'health'],
  records: ['putImmutable', 'get', 'applyRetention', 'placeLegalHold', 'deleteExpired'],
  scanner: ['scan'],
  notifications: ['send', 'receipt'],
  documents: ['generate', 'validateAccessibility'],
  policy: ['publish', 'activate', 'revoke', 'status'],
  telemetry: ['emit', 'measureClock', 'evaluateAlerts', 'health']
});

function validateProviderContracts(providers) {
  if (!providers || typeof providers !== 'object') throw contractError('PROVIDERS_REQUIRED');
  for (const [name, methods] of Object.entries(REQUIRED_CONTRACTS)) {
    const provider = providers[name];
    if (!provider || methods.some(method => typeof provider[method] !== 'function')) throw contractError(`INVALID_${name.toUpperCase()}_PROVIDER`);
  }
  return true;
}

function contractError(code) { const error = new Error('provider contract validation failed'); error.code = code; return error; }

module.exports = { REQUIRED_CONTRACTS, validateProviderContracts };