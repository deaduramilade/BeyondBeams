'use strict';

const { issueEnvelope } = require('../a2spa-r/envelope');
const { digest } = require('../a2spa-r/canonical');

class AuthorizationIssuer {
  constructor({ issuer, keyId, privateKey, audience, policy }) {
    if (![issuer, keyId, privateKey, audience].every(value => typeof value === 'string' && value.trim())) throw new Error('authorization issuer configuration is incomplete');
    this.issuer = issuer; this.keyId = keyId; this.privateKey = privateKey; this.audience = audience; this.policy = policy;
  }

  issue({ principal, actionType, payload, context }) {
    const completeContext = { ...context, action: actionType, payloadDigest: digest(payload, 'action-payload') };
    const policy = { id: this.policy.id, version: this.policy.version, digest: this.policy.digest };
    return issueEnvelope({ issuer: this.issuer, keyId: this.keyId, tenant: principal.tenantId, workload: principal.workloadId, audience: this.audience, permissions: [actionType], policy, context: completeContext, claimsDigest: digest(completeContext, 'authorization-context') }, this.privateKey);
  }
}

module.exports = { AuthorizationIssuer };