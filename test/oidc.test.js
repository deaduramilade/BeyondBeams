'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { JwksClient, createOidcVerifier } = require('../src/security/oidc');

const keys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwk = keys.publicKey.export({ format: 'jwk' });
Object.assign(jwk, { kid: 'identity-key-1', alg: 'ES256', use: 'sig' });

function token(claims, header = { alg: 'ES256', kid: 'identity-key-1', typ: 'at+jwt' }) {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.sign('sha256', Buffer.from(`${encodedHeader}.${encodedClaims}`), { key: keys.privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${encodedHeader}.${encodedClaims}.${signature}`;
}

test('verifies short-lived identity tokens and separates human, service, and agent identities', async () => {
  const now = 1700000000000;
  const client = new JwksClient({ uri: 'https://identity.example.invalid/jwks', fetch: async () => ({ ok: true, json: async () => ({ keys: [jwk] }) }), now: () => now });
  const verify = createOidcVerifier({ issuer: 'https://identity.example.invalid', audience: 'beyondbeams-api', jwksClient: client, now: () => now });
  for (const type of ['human', 'service', 'agent']) {
    const principal = await verify(token({ iss: 'https://identity.example.invalid', aud: 'beyondbeams-api', sub: `${type}-subject`, tenant_id: 'tenant-a', workload_id: `${type}-workload`, principal_type: type, scope: 'action:realtime.defense.breach.detect', iat: 1700000000, exp: 1700000060 }));
    assert.equal(principal.type, type);
  }
});

test('rejects wrong audience, expired/revoked tokens, unknown keys, and unavailable identity provider', async () => {
  const now = 1700000000000;
  const claims = { iss: 'https://identity.example.invalid', aud: 'wrong', sub: 'subject-a', tenant_id: 'tenant-a', workload_id: 'workload-a', principal_type: 'service', scope: 'action:*', iat: 1700000000, exp: 1700000060, jti: 'token-1' };
  const client = new JwksClient({ uri: 'https://identity.example.invalid/jwks', fetch: async () => ({ ok: true, json: async () => ({ keys: [jwk] }) }), now: () => now });
  const verify = createOidcVerifier({ issuer: claims.iss, audience: 'beyondbeams-api', jwksClient: client, now: () => now });
  await assert.rejects(() => verify(token(claims)), { code: 'INVALID_TOKEN_CLAIMS' });
  const revoked = createOidcVerifier({ issuer: claims.iss, audience: 'beyondbeams-api', jwksClient: client, now: () => now, isRevoked: async () => true });
  await assert.rejects(() => revoked(token({ ...claims, aud: 'beyondbeams-api' })), { code: 'REVOKED_TOKEN' });
  await assert.rejects(() => verify(token({ ...claims, aud: 'beyondbeams-api' }, { alg: 'ES256', kid: 'unknown', typ: 'at+jwt' })), { code: 'UNKNOWN_IDENTITY_KEY' });
  const unavailable = new JwksClient({ uri: 'https://identity.example.invalid/jwks', fetch: async () => { throw new Error('network'); } });
  await assert.rejects(() => unavailable.get('key', 'ES256'), { code: 'IDENTITY_PROVIDER_UNAVAILABLE' });
});
