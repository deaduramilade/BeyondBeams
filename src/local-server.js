'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const { createApp } = require('../server');
const { ACTIONS } = require('./actions');
const { KeyStore } = require('./a2spa-r/key-store');
const { PolicyRegistry, issuePolicyPack } = require('./policy/policy-pack');
const { createDevelopmentSigner } = require('./security/managed-signer');

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function createLocalApp(options = {}) {
  const runtimeDirectory = path.resolve(options.runtimeDirectory || path.join(__dirname, '..', 'runtime-data', 'local'));
  const policyKeys = generateKeys();
  const authorizationKeys = generateKeys();
  const receiptKeys = generateKeys();
  const now = Date.now();
  const policyPack = issuePolicyPack({
    id: 'policy.local-development',
    version: '1.0.0',
    publisher: 'policy-authority.local',
    keyId: 'policy-key-local',
    institution: 'institution.local',
    jurisdiction: 'jurisdiction.local',
    publishedAt: new Date(now - 120000).toISOString(),
    effectiveAt: new Date(now - 60000).toISOString(),
    expiresAt: new Date(now + 86400000).toISOString(),
    supersedes: null,
    approvals: [
      { role: 'policy-owner', approver: 'owner.local', approvedAt: new Date(now - 110000).toISOString() },
      { role: 'legal-rights', approver: 'rights.local', approvedAt: new Date(now - 100000).toISOString() }
    ],
    rules: [{
      id: 'permit-local-evaluation',
      effect: 'permit',
      actions: Object.keys(ACTIONS),
      purposes: ['local-evaluation'],
      principalTypes: ['human', 'service', 'agent'],
      humanApproval: { required: false, roles: [] },
      rights: { notice: true, humanReview: true, appeal: true, remedy: true }
    }]
  }, policyKeys.privateKey);
  const policyRegistry = new PolicyRegistry({
    packs: [policyPack],
    keyStore: new KeyStore([{ issuer: policyPack.publisher, keyId: policyPack.keyId, algorithm: 'ES256', publicKey: policyKeys.publicKey }]),
    active: policyPack
  });
  const config = {
    authorizationAudience: 'executor.local',
    authorizationKeys: new KeyStore([{ issuer: 'issuer.local', keyId: 'authorization-key-local', algorithm: 'ES256', publicKey: authorizationKeys.publicKey }]),
    authorizationIssuers: ['issuer.local'],
    deploymentDigest: crypto.createHash('sha256').update('oblivion-local-development').digest('hex'),
    receiptKeyId: 'receipt-key-local',
    replayDirectory: path.join(runtimeDirectory, 'replay'),
    auditDirectory: path.join(runtimeDirectory, 'audit'),
    caseDirectory: path.join(runtimeDirectory, 'cases'),
    corsOrigins: [],
    bodyLimit: '32kb',
    rateLimit: 60,
    rateWindowMs: 60000,
    clockSkewSeconds: 30,
    metricsToken: null,
    oidcLoginUrl: null,
    appOrigin: null,
    sessionCookieName: 'oblivion_session',
    sessionCookieSecure: false
  };
  const identityVerifier = async () => {
    const error = new Error('local identity provider is not configured');
    error.code = 'IDENTITY_PROVIDER_UNAVAILABLE';
    throw error;
  };

  return createApp({
    config,
    policyRegistry,
    identityVerifier,
    signer: createDevelopmentSigner({ keyId: config.receiptKeyId, privateKey: receiptKeys.privateKey }),
    logger: options.logger
  });
}

function resolveLocalHost(value) {
  const host = value || '127.0.0.1';
  if (!LOOPBACK_HOSTS.has(host)) throw new Error('local server HOST must be a loopback address');
  return host;
}

function resolvePort(value) {
  if (value === undefined) return 3000;
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  return port;
}

function startLocalServer() {
  const host = resolveLocalHost(process.env.HOST);
  const port = resolvePort(process.env.PORT);
  const server = createLocalApp().listen(port, host, () => {
    console.log(JSON.stringify({ level: 'info', event: 'local_server_started', url: `http://${host}:${port}`, mode: 'development-only' }));
  });
  const shutdown = signal => {
    console.log(JSON.stringify({ level: 'info', event: 'local_server_stopping', signal }));
    server.close(error => { process.exitCode = error ? 1 : 0; });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

function generateKeys() {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });
}

if (require.main === module) startLocalServer();

module.exports = { createLocalApp, resolveLocalHost, resolvePort, startLocalServer };