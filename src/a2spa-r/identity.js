'use strict';

const { fail } = require('./errors');
const { identifier } = require('./validation');

function validateIdentityBinding(envelope, context) {
  identifier(envelope.issuer, 'issuer');
  identifier(envelope.workload, 'workload');
  identifier(envelope.audience, 'audience');
  if (envelope.audience !== context.audience) fail('WRONG_AUDIENCE', 'authorization audience does not match this verifier');
  if (envelope.tenant !== context.tenant) fail('WRONG_TENANT', 'authorization tenant does not match the caller');
  if (envelope.workload !== context.workload) fail('WRONG_WORKLOAD', 'authorization workload does not match the caller');
  if (context.issuers && !context.issuers.includes(envelope.issuer)) fail('UNTRUSTED_ISSUER', 'authorization issuer is not trusted');
}

module.exports = { validateIdentityBinding };