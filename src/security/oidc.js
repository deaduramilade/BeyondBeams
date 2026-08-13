'use strict';

const crypto = require('crypto');
const { identifier } = require('../a2spa-r/validation');

const ALGORITHMS = Object.freeze({
  ES256: { algorithm: 'sha256', dsaEncoding: 'ieee-p1363', keyType: 'EC' },
  RS256: { algorithm: 'RSA-SHA256', keyType: 'RSA' }
});

class JwksClient {
  constructor({ uri, fetch: fetchImpl = globalThis.fetch, cacheMs = 300000, now = Date.now }) {
    const parsed = new URL(uri);
    if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      throw new Error('OIDC_JWKS_URI must use HTTPS');
    }
    this.uri = parsed.href;
    this.fetch = fetchImpl;
    this.cacheMs = cacheMs;
    this.now = now;
    this.cached = null;
  }

  async get(keyId, algorithm) {
    let keys = await this.load(false);
    let key = keys.find(candidate => candidate.kid === keyId && candidate.alg === algorithm && candidate.use !== 'enc');
    if (!key) {
      keys = await this.load(true);
      key = keys.find(candidate => candidate.kid === keyId && candidate.alg === algorithm && candidate.use !== 'enc');
    }
    if (!key) throw authError('UNKNOWN_IDENTITY_KEY');
    return key;
  }

  async load(force) {
    if (!force && this.cached && this.cached.expiresAt > this.now()) return this.cached.keys;
    let response;
    try {
      response = await this.fetch(this.uri, { headers: { accept: 'application/json' }, redirect: 'error' });
    } catch {
      throw authError('IDENTITY_PROVIDER_UNAVAILABLE');
    }
    if (!response.ok) throw authError('IDENTITY_PROVIDER_UNAVAILABLE');
    const body = await response.json();
    if (!body || !Array.isArray(body.keys) || body.keys.length === 0) throw authError('INVALID_JWKS');
    this.cached = { keys: body.keys, expiresAt: this.now() + this.cacheMs };
    return body.keys;
  }
}

function createOidcVerifier(options) {
  const { issuer, audience, jwksClient, clockSkewSeconds = 30, now = Date.now } = options;
  if (!issuer || !audience || !jwksClient) throw new Error('OIDC issuer, audience, and JWKS client are required');
  return async token => {
    const parts = typeof token === 'string' ? token.split('.') : [];
    if (parts.length !== 3) throw authError('INVALID_TOKEN');
    const header = parseSegment(parts[0]);
    const claims = parseSegment(parts[1]);
    const specification = ALGORITHMS[header.alg];
    if (!specification || typeof header.kid !== 'string' || header.typ && header.typ !== 'JWT' && header.typ !== 'at+jwt') {
      throw authError('INVALID_TOKEN');
    }
    const jwk = await jwksClient.get(header.kid, header.alg);
    if (jwk.kty !== specification.keyType) throw authError('INVALID_TOKEN');
    let publicKey;
    try { publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' }); } catch { throw authError('INVALID_TOKEN'); }
    const signature = Buffer.from(parts[2], 'base64url');
    const verifyOptions = specification.dsaEncoding ? { key: publicKey, dsaEncoding: specification.dsaEncoding } : publicKey;
    if (!crypto.verify(specification.algorithm, Buffer.from(`${parts[0]}.${parts[1]}`), verifyOptions, signature)) throw authError('INVALID_TOKEN');

    const current = Math.floor(now() / 1000);
    const skew = clockSkewSeconds;
    if (claims.iss !== issuer || !matchesAudience(claims.aud, audience) || !Number.isInteger(claims.exp) || claims.exp <= current - skew ||
        !Number.isInteger(claims.iat) || claims.iat > current + skew || claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > current + skew)) {
      throw authError('INVALID_TOKEN_CLAIMS');
    }
    if (typeof claims.sub !== 'string' || typeof claims.tenant_id !== 'string' || typeof claims.workload_id !== 'string' ||
        !['human', 'service', 'agent'].includes(claims.principal_type)) throw authError('INVALID_TOKEN_CLAIMS');
    identifier(claims.sub, 'token subject');
    identifier(claims.tenant_id, 'token tenant');
    identifier(claims.workload_id, 'token workload');
    const scopes = parseScopes(claims.scope);
    if (claims.jti && options.isRevoked && await options.isRevoked({ issuer: claims.iss, subject: claims.sub, tokenId: claims.jti })) {
      throw authError('REVOKED_TOKEN');
    }
    return Object.freeze({
      id: claims.sub,
      issuer: claims.iss,
      tenantId: claims.tenant_id,
      workloadId: claims.workload_id,
      type: claims.principal_type,
      scopes,
      roles: parseRoles(claims.roles),
      tokenId: claims.jti || null
    });
  };
}

function parseRoles(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(role => typeof role !== 'string')) throw authError('INVALID_TOKEN_CLAIMS');
  return [...new Set(value)];
}

function parseSegment(segment) {
  try {
    const value = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw authError('INVALID_TOKEN'); }
}

function parseScopes(value) {
  const scopes = typeof value === 'string' ? value.split(' ').filter(Boolean) : [];
  if (!scopes.length || scopes.some(scope => !/^[A-Za-z0-9:*._/-]{1,128}$/.test(scope))) throw authError('INVALID_TOKEN_CLAIMS');
  return [...new Set(scopes)];
}

function matchesAudience(actual, expected) {
  return actual === expected || Array.isArray(actual) && actual.includes(expected);
}

function authError(code) {
  const error = new Error('authentication failed');
  error.code = code;
  return error;
}

module.exports = { JwksClient, createOidcVerifier };