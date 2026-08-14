'use strict';

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const path = require('path');

const beyondBeams = require('./src/BeyondBeams');
const { ACTIONS, hasActionScope, validateExecuteRequest } = require('./src/actions');
const { digest } = require('./src/a2spa-r/canonical');
const { verifyEnvelope } = require('./src/a2spa-r/envelope');
const { KeyStore } = require('./src/a2spa-r/key-store');
const { FileReplayStore } = require('./src/a2spa-r/replay');
const { issueReceipt } = require('./src/a2spa-r/receipt');
const { AuditLedger } = require('./src/audit/ledger');
const { JwksClient, createOidcVerifier } = require('./src/security/oidc');
const { createDevelopmentSigner } = require('./src/security/managed-signer');
const { PolicyRegistry } = require('./src/policy/policy-pack');
const { Metrics } = require('./src/operations/metrics');
const { CaseStore } = require('./src/cases/store');
const { AuthorizationIssuer } = require('./src/security/authorization-issuer');

const DEFAULT_BODY_LIMIT = '32kb';
const DEFAULT_RATE_LIMIT = 60;
const DEFAULT_RATE_WINDOW_MS = 60000;

function createApp(options = {}) {
  const env = options.env || process.env;
  const config = options.config || loadConfig(env);
  config.sessionCookieName = validCookieName(config.sessionCookieName || 'beyondbeams_session');
  config.sessionCookieSecure = config.sessionCookieSecure === true;
  config.appOrigin = config.appOrigin || null;
  const logger = options.logger || createLogger();
  const execute = options.execute || ((actionType, payload) => beyondBeams.execute(actionType, payload));
  const replayStore = options.replayStore || new FileReplayStore({ directory: config.replayDirectory });
  const auditLedger = options.auditLedger || new AuditLedger({ directory: config.auditDirectory });
  const signer = options.signer || createDevelopmentSigner({ keyId: config.receiptKeyId, privateKey: normalizePem(env.RECEIPT_PRIVATE_KEY) });
  const policyRegistry = options.policyRegistry || config.policyRegistry;
  const metrics = options.metrics || new Metrics();
  const caseStore = options.caseStore || new CaseStore({ directory: config.caseDirectory || path.join(config.auditDirectory, 'cases') });
  const authorizationIssuer = options.authorizationIssuer || config.authorizationIssuer;
  const identityVerifier = options.identityVerifier || createOidcVerifier({
    issuer: config.oidcIssuer,
    audience: config.oidcAudience,
    jwksClient: new JwksClient({ uri: config.oidcJwksUri }),
    clockSkewSeconds: config.clockSkewSeconds
  });
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 600
  }));
  app.use(express.json({ limit: config.bodyLimit, strict: true }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  const identityProvider = options.identityProvider || null;
  const tokenExchange = options.tokenExchange || null;
  app.use('/auth', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/auth/login', async (req, res) => {
    if (!identityProvider) return config.oidcLoginUrl ? res.redirect(302, config.oidcLoginUrl) : sendError(res, 503, 'SIGN_IN_UNAVAILABLE', 'sign-in provider is not configured');
    try {
      const authorization = await identityProvider.beginAuthorization({ returnTo: validReturnPath(req.query.returnTo) });
      return res.redirect(302, authorization.authorizationUrl);
    } catch (error) { return sendError(res, 400, safeCode(error.code), 'sign-in request was rejected'); }
  });
  app.get('/auth/callback', async (req, res) => {
    if (!identityProvider || !tokenExchange) return sendError(res, 503, 'SIGN_IN_UNAVAILABLE', 'sign-in provider is not configured');
    if (!validAuthorizationResponse(req.query)) return sendError(res, 400, 'INVALID_OIDC_CALLBACK', 'sign-in callback is invalid');
    try {
      const session = await identityProvider.completeAuthorization({ state: req.query.state, code: req.query.code, exchange: tokenExchange });
      setSessionCookie(res, config, session.sessionId, session.expiresAt);
      return res.redirect(303, validReturnPath(session.returnTo));
    } catch (error) { return sendError(res, 401, safeCode(error.code), 'sign-in callback was rejected'); }
  });
  app.get('/metrics', authenticateMetrics(config.metricsToken), (req, res) => {
    metrics.set('beyondbeams_dependency_ready', { dependency: 'policy' }, policyRegistry.status().ready ? 1 : 0);
    metrics.set('beyondbeams_dependency_ready', { dependency: 'audit' }, auditLedger.verify().valid ? 1 : 0);
    res.type('text/plain').send(metrics.render());
  });
  app.get('/ready', async (req, res) => {
    const audit = auditLedger.verify();
    const signerReady = await signer.readiness();
    const policyReady = policyRegistry.status().ready;
    const ready = audit.valid && policyReady && signerReady;
    metrics.set('beyondbeams_dependency_ready', { dependency: 'policy' }, policyReady ? 1 : 0);
    metrics.set('beyondbeams_dependency_ready', { dependency: 'audit' }, audit.valid ? 1 : 0);
    metrics.set('beyondbeams_dependency_ready', { dependency: 'receipt_signer' }, signerReady ? 1 : 0);
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
  });
  const browserShell = path.join(__dirname, 'dashboard', 'index.html');
  for (const route of ['/', '/sign-in', '/agents', '/dashboard', '/cases/new', '/review', '/admin/audit', '/legal/privacy', '/legal/cookies', '/legal/terms']) {
    app.get(route, (req, res) => res.sendFile(browserShell));
  }
  app.get('/agents/:agentId', (req, res) => res.sendFile(browserShell));
  app.get('/cases/:caseId', (req, res) => res.sendFile(browserShell));
  app.use(express.static(path.join(__dirname, 'dashboard'), { index: 'index.html' }));

  const authenticate = createAuthenticator(identityVerifier, auditLedger, config.sessionCookieName, identityProvider);
  const requireCsrf = createCsrfProtection(identityProvider, config);
  const rateLimit = createRateLimiter({ limit: config.rateLimit, windowMs: config.rateWindowMs, now: options.now });

  app.get('/auth/csrf', authenticate, async (req, res) => {
    if (req.authMethod !== 'session' || !identityProvider) return sendError(res, 400, 'SESSION_REQUIRED', 'browser session is required');
    try { return res.json({ csrfToken: await identityProvider.issueCsrfToken(req.sessionId) }); }
    catch (error) { return sendError(res, 401, safeCode(error.code), 'browser session is invalid'); }
  });
  app.post('/auth/session/refresh', authenticate, requireCsrf, async (req, res) => {
    if (req.authMethod !== 'session' || !identityProvider) return sendError(res, 400, 'SESSION_REQUIRED', 'browser session is required');
    try {
      const session = await identityProvider.rotateSession(req.sessionId);
      setSessionCookie(res, config, session.sessionId, session.expiresAt);
      return res.status(204).end();
    } catch (error) { return sendError(res, 401, safeCode(error.code), 'browser session could not be refreshed'); }
  });
  app.post('/auth/logout', authenticate, requireCsrf, async (req, res) => {
    if (req.authMethod !== 'session' || !identityProvider) return sendError(res, 400, 'SESSION_REQUIRED', 'browser session is required');
    try {
      const result = await identityProvider.logout(req.sessionId);
      clearSessionCookie(res, config);
      return res.json({ loggedOut: true, providerLogoutUrl: safeRedirectUrl(result.providerLogoutUrl) });
    } catch (error) { return sendError(res, 401, safeCode(error.code), 'browser session could not be ended'); }
  });

  app.post('/execute', authenticate, requireCsrf, rateLimit, async (req, res) => {
    metrics.increment('beyondbeams_requests_total', { route: 'execute', status: 'received' });
    const requestId = validRequestId(req.headers['x-request-id']) || crypto.randomUUID();
    const validation = validateExecuteRequest(req.body);
    if (!validation.valid) return sendError(res, 400, 'INVALID_REQUEST', validation.message, requestId);
    if (!hasActionScope(req.principal.scopes, req.body.actionType)) {
      recordAudit(auditLedger, 'authorization_denied', auditData(req.principal, req.body.actionType, requestId, 'INSUFFICIENT_SCOPE'));
      return sendError(res, 403, 'INSUFFICIENT_SCOPE', 'identity is not authorized for this action', requestId);
    }

    const payloadDigest = digest(req.body.payload, 'action-payload');
    const authorization = verifyEnvelope(req.body.authorization, {
      audience: config.authorizationAudience,
      tenant: req.principal.tenantId,
      workload: req.principal.workloadId,
      issuers: config.authorizationIssuers,
      keyStore: config.authorizationKeys,
      replayStore,
      policyDigest: policyRegistry.status().digest,
      action: req.body.actionType,
      payloadDigest,
      clockSkewMs: config.clockSkewSeconds * 1000
    });
    if (!authorization.valid) {
      recordAudit(auditLedger, 'authorization_denied', auditData(req.principal, req.body.actionType, requestId, authorization.reason));
      return sendError(res, authorization.reason === 'REPLAYED_AUTHORIZATION' ? 409 : 403, 'AUTHORIZATION_DENIED', authorization.reason, requestId);
    }
    if (!authorization.envelope.permissions.includes(ACTIONS[req.body.actionType].scope) && !authorization.envelope.permissions.includes(req.body.actionType)) {
      recordAudit(auditLedger, 'authorization_denied', auditData(req.principal, req.body.actionType, requestId, 'PERMISSION_MISMATCH'));
      return sendError(res, 403, 'AUTHORIZATION_DENIED', 'PERMISSION_MISMATCH', requestId);
    }
    const policyDecision = policyRegistry.decide({ principal: req.principal, action: req.body.actionType, context: authorization.envelope.context });
    recordAudit(auditLedger, 'policy_decision', {
      ...auditData(req.principal, req.body.actionType, requestId, policyDecision.reason),
      decisionId: policyDecision.decisionId, decision: policyDecision.value, ruleId: policyDecision.ruleId || null,
      policyId: authorization.envelope.policy.id, policyVersion: authorization.envelope.policy.version,
      policyDigest: authorization.envelope.policy.digest
    });
    metrics.increment('beyondbeams_policy_decisions_total', { decision: policyDecision.value, reason: policyDecision.reason });
    if (policyDecision.value !== 'permit') return sendError(res, 403, 'POLICY_DENIED', policyDecision.reason, requestId);
    if (!await signer.readiness()) return sendError(res, 503, 'KEY_SERVICE_UNAVAILABLE', 'receipt signing service is unavailable', requestId);

    const startedAt = new Date().toISOString();
    recordAudit(auditLedger, 'authorization_permitted', {
      ...auditData(req.principal, req.body.actionType, requestId, policyDecision.reason),
      decisionId: policyDecision.decisionId, ruleId: policyDecision.ruleId,
      authorizationDigest: digest(authorization.envelope, 'authorization-envelope'), payloadDigest,
      policyId: authorization.envelope.policy.id, policyVersion: authorization.envelope.policy.version,
      retentionClass: authorization.envelope.context.retentionClass, legalHold: Boolean(authorization.envelope.context.legalHold)
    });
    let result;
    let executionError;
    try { result = await execute(req.body.actionType, req.body.payload); }
    catch (error) { executionError = error; }
    const completedAt = new Date().toISOString();
    try {
      const receipt = await issueReceipt({
        requestId,
        authorization: authorization.envelope,
        payload: req.body.payload,
        principal: req.principal,
        action: req.body.actionType,
        deploymentDigest: config.deploymentDigest,
        decision: { value: 'permit', reason: policyDecision.reason },
        outcome: executionError
          ? { status: 'failed', code: safeCode(executionError.code) }
          : { status: 'succeeded', code: result.status || 'COMPLETED', resultDigest: digest(result, 'action-result') },
        startedAt,
        completedAt,
        retention: { class: authorization.envelope.context.retentionClass, legalHold: Boolean(authorization.envelope.context.legalHold) }
      }, signer);
      recordAudit(auditLedger, 'receipt_issued', receiptAuditData(req.principal, receipt));
      if (executionError) {
        logger.error({ event: 'action_failed', requestId, actionType: req.body.actionType, code: safeCode(executionError.code), receiptId: receipt.receiptId });
        metrics.increment('beyondbeams_requests_total', { route: 'execute', status: '500' });
        return res.status(500).json({ success: false, requestId, error: { code: 'EXECUTION_FAILED', message: 'action execution failed' }, receipt });
      }
      logger.info({ event: 'action_completed', requestId, actionType: req.body.actionType, receiptId: receipt.receiptId });
      metrics.increment('beyondbeams_requests_total', { route: 'execute', status: '200' });
      return res.json({ success: true, requestId, result, receipt });
    } catch (evidenceError) {
      logger.error({ event: 'receipt_failed', requestId, code: safeCode(evidenceError.code), executionStatus: executionError ? 'failed' : 'succeeded' });
      return sendError(res, 503, 'EVIDENCE_UNAVAILABLE', 'execution evidence could not be completed', requestId);
    }
  });

  app.get('/api/cases', authenticate, requireScope('case:read'), (req, res) => {
    const filters = { state: req.query.state, assignedTo: req.query.assignedTo, requesterId: req.query.requesterId, priority: req.query.priority, query: req.query.query, order: req.query.order, overdue: req.query.overdue === 'true' };
    return res.json({ cases: caseStore.list(req.principal.tenantId, filters) });
  });

  app.get('/api/cases/:caseId', authenticate, requireScope('case:read'), (req, res) => {
    const record = caseStore.get(req.principal.tenantId, req.params.caseId);
    return record ? res.json({ case: record }) : sendError(res, 404, 'CASE_NOT_FOUND', 'case was not found');
  });

  app.post('/api/cases', authenticate, requireCsrf, requireScope('case:create'), (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!['guided', 'json'].includes(body.inputMethod)) return sendError(res, 400, 'INVALID_INPUT_METHOD', 'inputMethod must be guided or json');
    const validation = validateExecuteRequest({ actionType: body.actionType, payload: body.payload });
    if (!validation.valid) return sendError(res, 400, 'INVALID_REQUEST', validation.message);
    if (!authorizationIssuer) return sendError(res, 503, 'AUTHORIZATION_SERVICE_UNAVAILABLE', 'authorization issuance is unavailable');
    try {
      const context = { purpose: body.purpose || 'case-review', institution: body.institution || authorizationIssuer.policy.institution, jurisdiction: body.jurisdiction || authorizationIssuer.policy.jurisdiction, retentionClass: 'case-record', legalHold: false };
      const policyDecision = policyRegistry.decide({ principal: req.principal, action: body.actionType, context });
      recordAudit(auditLedger, 'case_policy_decision', { ...auditAccessData(req.principal, 'case_policy'), action: body.actionType, decision: policyDecision.value, reason: policyDecision.reason });
      if (policyDecision.value !== 'permit') return sendError(res, 403, 'POLICY_DENIED', policyDecision.reason);
      const authorization = authorizationIssuer.issue({ principal: req.principal, actionType: body.actionType, payload: body.payload, context });
      const record = caseStore.create({ tenantId: req.principal.tenantId, actorId: req.principal.id, actionType: body.actionType, payload: body.payload, inputMethod: body.inputMethod });
      caseStore.transition({ tenantId: req.principal.tenantId, caseId: record.caseId, actorId: req.principal.id, actorRoles: ['requester'], target: 'submitted' });
      recordAudit(auditLedger, 'case_submitted', { ...auditAccessData(req.principal, 'case_submit'), caseId: record.caseId, action: body.actionType, inputMethod: body.inputMethod });
      return res.status(201).json({ case: caseStore.get(req.principal.tenantId, record.caseId), authorization: { issued: true, expiresAt: authorization.expiresAt } });
    } catch (error) { return sendError(res, 503, 'CASE_UNAVAILABLE', safeCode(error.code)); }
  });

  app.post('/api/cases/:caseId/transition', authenticate, requireCsrf, requireScope('case:review'), (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (typeof body.target !== 'string') return sendError(res, 400, 'INVALID_TRANSITION', 'target is required');
    try {
      const record = caseStore.transition({ tenantId: req.principal.tenantId, caseId: req.params.caseId, actorId: req.principal.id, actorRoles: req.principal.roles, target: body.target, assignedTo: body.assignedTo, record: body.record || body.decision });
      recordAudit(auditLedger, 'case_transitioned', { ...auditAccessData(req.principal, 'case_transition'), caseId: record.caseId, target: body.target });
      return res.json({ case: record });
    } catch (error) { return sendError(res, error.code === 'CASE_NOT_FOUND' ? 404 : 409, safeCode(error.code), 'case transition was rejected'); }
  });

  for (const [operation, scope] of [['assign', 'case:review'], ['schedule', 'case:review'], ['escalate', 'case:review'], ['notes', 'case:read'], ['evidence', 'case:read']]) {
    app.post(`/api/cases/:caseId/${operation}`, authenticate, requireCsrf, requireScope(scope), (req, res) => {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      try {
        const input = { tenantId: req.principal.tenantId, caseId: req.params.caseId, actorId: req.principal.id, actorRoles: req.principal.roles, ...body };
        const result = operation === 'assign' ? caseStore.assign(input) : operation === 'schedule' ? caseStore.schedule(input) : operation === 'escalate' ? caseStore.escalate(input) : operation === 'notes' ? caseStore.addNote(input) : caseStore.addEvidence({ ...input, evidence: body.evidence });
        recordAudit(auditLedger, `case_${operation}`, { ...auditAccessData(req.principal, `case_${operation}`), caseId: req.params.caseId });
        return res.json({ case: caseStore.get(req.principal.tenantId, req.params.caseId), result });
      } catch (error) { return sendError(res, error.code === 'CASE_NOT_FOUND' ? 404 : 409, safeCode(error.code), 'case operation was rejected'); }
    });
  }

  app.get('/audit/integrity', authenticate, requireScope('audit:verify'), (req, res) => {
    recordAudit(auditLedger, 'audit_accessed', auditAccessData(req.principal, 'verify'));
    const result = auditLedger.verify();
    return res.status(result.valid ? 200 : 503).json(result);
  });
  app.get('/audit/export', authenticate, requireScope('audit:export'), (req, res) => {
    recordAudit(auditLedger, 'audit_accessed', auditAccessData(req.principal, 'export'));
    return res.json(auditLedger.export({ tenantId: req.principal.tenantId }));
  });

  app.use((req, res) => sendError(res, 404, 'NOT_FOUND', 'resource not found'));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.too.large') return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'request payload exceeds the configured limit');
    if (error instanceof SyntaxError && error.status === 400) return sendError(res, 400, 'INVALID_JSON', 'request body must contain valid JSON');
    logger.error({ event: 'request_failed', code: safeCode(error.code) });
    return sendError(res, 500, 'INTERNAL_ERROR', 'request failed');
  });
  return app;
}

function loadConfig(env) {
  const oidcIssuer = requiredUrl(env.OIDC_ISSUER, 'OIDC_ISSUER');
  const oidcJwksUri = requiredUrl(env.OIDC_JWKS_URI, 'OIDC_JWKS_URI');
  const oidcAudience = required(env.OIDC_AUDIENCE, 'OIDC_AUDIENCE');
  const authorizationAudience = required(env.A2SPA_AUDIENCE, 'A2SPA_AUDIENCE');
  const authorizationRecords = parseJson(env.A2SPA_TRUSTED_KEYS, 'A2SPA_TRUSTED_KEYS');
  if (!Array.isArray(authorizationRecords) || authorizationRecords.length === 0) throw new Error('A2SPA_TRUSTED_KEYS must define trusted verification keys');
  const authorizationKeys = new KeyStore(authorizationRecords.map(record => ({ ...record, publicKey: normalizePem(record.publicKey) })));
  const authorizationIssuers = [...new Set(authorizationRecords.map(record => record.issuer))];
  const activePolicy = parseJson(env.ACTIVE_POLICY, 'ACTIVE_POLICY');
  if (!activePolicy || typeof activePolicy.id !== 'string' || typeof activePolicy.version !== 'string') throw new Error('ACTIVE_POLICY is invalid');
  const policyKeyRecords = parseJson(env.POLICY_TRUSTED_KEYS, 'POLICY_TRUSTED_KEYS');
  if (!Array.isArray(policyKeyRecords) || policyKeyRecords.length === 0) throw new Error('POLICY_TRUSTED_KEYS must define trusted policy publisher keys');
  const policyPacks = parseJson(env.POLICY_PACKS, 'POLICY_PACKS');
  if (!Array.isArray(policyPacks) || policyPacks.length === 0) throw new Error('POLICY_PACKS must define signed policy packs');
  const policyRegistry = new PolicyRegistry({
    packs: policyPacks,
    keyStore: new KeyStore(policyKeyRecords.map(record => ({ ...record, publicKey: normalizePem(record.publicKey) }))),
    active: activePolicy,
    revoked: env.REVOKED_POLICIES ? parseJson(env.REVOKED_POLICIES, 'REVOKED_POLICIES') : []
  });
  if (activePolicy.digest && activePolicy.digest !== policyRegistry.status().digest) throw new Error('ACTIVE_POLICY digest does not match the signed policy pack');
  const activePolicyPack = policyPacks.find(pack => pack.id === activePolicy.id && pack.version === activePolicy.version);
  const deploymentDigest = requiredDigest(env.DEPLOYMENT_DIGEST, 'DEPLOYMENT_DIGEST');
  const receiptKeyId = required(env.RECEIPT_KEY_ID, 'RECEIPT_KEY_ID');
  if (!env.RECEIPT_PRIVATE_KEY) throw new Error('RECEIPT_PRIVATE_KEY is required for the development signer');
  return {
    oidcIssuer,
    oidcJwksUri,
    oidcAudience,
    authorizationAudience,
    authorizationKeys,
    authorizationIssuers,
    policyRegistry,
    authorizationIssuer: env.AUTHORIZATION_PRIVATE_KEY ? new AuthorizationIssuer({ issuer: required(env.AUTHORIZATION_ISSUER, 'AUTHORIZATION_ISSUER'), keyId: required(env.AUTHORIZATION_KEY_ID, 'AUTHORIZATION_KEY_ID'), privateKey: normalizePem(env.AUTHORIZATION_PRIVATE_KEY), audience: authorizationAudience, policy: { id: activePolicy.id, version: activePolicy.version, digest: policyRegistry.status().digest, institution: activePolicyPack.institution, jurisdiction: activePolicyPack.jurisdiction } }) : null,
    deploymentDigest,
    receiptKeyId,
    replayDirectory: absoluteDirectory(env.REPLAY_STORE_DIR, 'REPLAY_STORE_DIR'),
    auditDirectory: absoluteDirectory(env.AUDIT_STORE_DIR, 'AUDIT_STORE_DIR'),
    caseDirectory: env.CASE_STORE_DIR ? absoluteDirectory(env.CASE_STORE_DIR, 'CASE_STORE_DIR') : undefined,
    corsOrigins: parseOrigins(env.CORS_ORIGINS),
    bodyLimit: env.BODY_LIMIT || DEFAULT_BODY_LIMIT,
    rateLimit: positiveInteger(env.RATE_LIMIT, DEFAULT_RATE_LIMIT, 'RATE_LIMIT'),
    rateWindowMs: positiveInteger(env.RATE_WINDOW_MS, DEFAULT_RATE_WINDOW_MS, 'RATE_WINDOW_MS'),
    clockSkewSeconds: positiveInteger(env.CLOCK_SKEW_SECONDS, 30, 'CLOCK_SKEW_SECONDS'),
    metricsToken: env.METRICS_TOKEN || null,
    oidcLoginUrl: env.OIDC_LOGIN_URL ? requiredUrl(env.OIDC_LOGIN_URL, 'OIDC_LOGIN_URL') : null,
    appOrigin: env.APP_ORIGIN ? parseOrigin(env.APP_ORIGIN, 'APP_ORIGIN') : null,
    sessionCookieName: validCookieName(env.SESSION_COOKIE_NAME || 'beyondbeams_session'),
    sessionCookieSecure: env.APP_ORIGIN ? new URL(env.APP_ORIGIN).protocol === 'https:' : false
  };
}

function createAuthenticator(verify, auditLedger, sessionCookieName = 'beyondbeams_session', identityProvider = null) {
  return async (req, res, next) => {
    const header = req.get('authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const sessionId = bearer ? null : readCookie(req.get('cookie'), sessionCookieName);
    const token = bearer || sessionId;
    if (!token) return sendError(res, 401, 'UNAUTHORIZED', 'valid bearer authentication is required');
    try {
      req.principal = sessionId && identityProvider ? await identityProvider.authenticateSession(sessionId) : await verify(token);
      req.authMethod = sessionId ? 'session' : 'bearer';
      req.sessionId = sessionId;
      recordAudit(auditLedger, 'authentication_succeeded', { tenant: req.principal.tenantId, actorDigest: opaque(req.principal.id), workloadDigest: opaque(req.principal.workloadId), principalType: req.principal.type, retentionClass: 'security-audit', legalHold: false });
      return next();
    } catch (error) {
      try { recordAudit(auditLedger, 'authentication_failed', { tenant: 'unknown', reason: safeCode(error.code), retentionClass: 'security-audit', legalHold: false }); } catch {}
      return sendError(res, 401, 'UNAUTHORIZED', 'valid bearer authentication is required');
    }
  };
}

function createCsrfProtection(identityProvider, config) {
  return async (req, res, next) => {
    if (req.authMethod !== 'session') return next();
    if (!identityProvider) return sendError(res, 503, 'SESSION_SECURITY_UNAVAILABLE', 'browser session security is not configured');
    const expectedOrigin = config.appOrigin || `${req.protocol}://${req.get('host')}`;
    if (req.get('origin') !== expectedOrigin) return sendError(res, 403, 'INVALID_ORIGIN', 'request origin was rejected');
    try { await identityProvider.verifyCsrfToken(req.sessionId, req.get('x-csrf-token')); return next(); }
    catch (error) { return sendError(res, 403, safeCode(error.code), 'CSRF token was rejected'); }
  };
}

function readCookie(header, name) {
  if (!header || !name) return null;
  const match = header.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  if (!match) return null;
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return null; }
}

function setSessionCookie(res, config, sessionId, expiresAt) {
  if (typeof sessionId !== 'string' || !sessionId || !Number.isFinite(Date.parse(expiresAt))) throw new Error('identity provider returned an invalid session');
  res.append('Set-Cookie', serializeCookie(config.sessionCookieName, sessionId, { secure: config.sessionCookieSecure, expires: expiresAt }));
}

function clearSessionCookie(res, config) {
  res.append('Set-Cookie', serializeCookie(config.sessionCookieName, '', { secure: config.sessionCookieSecure, expires: 'Thu, 01 Jan 1970 00:00:00 GMT' }));
}

function serializeCookie(name, value, { secure, expires }) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expires).toUTCString()}${secure ? '; Secure' : ''}`;
}

function authenticateMetrics(configuredToken) {
  return (req, res, next) => configuredToken && req.get('x-metrics-token') === configuredToken
    ? next()
    : sendError(res, 404, 'NOT_FOUND', 'resource not found');
}

function requireScope(scope) {
  return (req, res, next) => req.principal.scopes.includes(scope)
    ? next()
    : sendError(res, 403, 'INSUFFICIENT_SCOPE', 'identity is not authorized for this operation');
}

function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const buckets = new Map();
  return (req, res, next) => {
    const current = now();
    for (const [principalId, candidate] of buckets) if (current >= candidate.resetAt) buckets.delete(principalId);
    const bucketKey = `${req.principal.tenantId}\0${req.principal.id}`;
    const bucket = buckets.get(bucketKey);
    if (!bucket || current >= bucket.resetAt) {
      buckets.set(bucketKey, { count: 1, resetAt: current + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - current) / 1000)));
      return sendError(res, 429, 'RATE_LIMITED', 'request rate limit exceeded');
    }
    return next();
  };
}

function auditData(principal, action, requestId, reason) {
  return { tenant: principal.tenantId, actorDigest: opaque(principal.id), workloadDigest: opaque(principal.workloadId), principalType: principal.type, action, requestId, reason, retentionClass: 'security-audit', legalHold: false };
}

function receiptAuditData(principal, receipt) {
  return { tenant: principal.tenantId, receiptId: receipt.receiptId, receiptDigest: digest(receipt, 'signed-receipt'), authorizationDigest: receipt.authorizationDigest, outcome: receipt.outcome.status, retentionClass: receipt.retention.class, legalHold: receipt.retention.legalHold };
}

function auditAccessData(principal, operation) {
  return { tenant: principal.tenantId, actorDigest: opaque(principal.id), principalType: principal.type, operation, retentionClass: 'security-audit', legalHold: false };
}

function recordAudit(ledger, type, data) { return ledger.append(type, data); }
function opaque(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function safeCode(code) { return typeof code === 'string' && /^[A-Z0-9_]{1,64}$/.test(code) ? code : 'EXECUTION_FAILED'; }
function sendError(res, status, code, message, requestId) { return res.status(status).json({ success: false, error: { code, message }, ...(requestId ? { requestId } : {}) }); }
function validRequestId(value) { return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null; }
function normalizePem(value) { return typeof value === 'string' ? value.replace(/\\n/g, '\n') : value; }
function required(value, name) { if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`); return value.trim(); }
function requiredUrl(value, name) { const parsed = new URL(required(value, name)); if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') throw new Error(`${name} must use HTTPS`); return parsed.href.replace(/\/$/, ''); }
function requiredDigest(value, name) { if (!/^[0-9a-f]{64}$/.test(value || '')) throw new Error(`${name} must be a SHA-256 digest`); return value; }
function parseJson(value, name) { try { return JSON.parse(required(value, name)); } catch (error) { if (error.message.endsWith('is required')) throw error; throw new Error(`${name} must be valid JSON`); } }
function absoluteDirectory(value, name) { const directory = required(value, name); if (!path.isAbsolute(directory)) throw new Error(`${name} must be an absolute path`); return directory; }
function parseOrigins(value) { if (!value) return []; return value.split(',').map(origin => origin.trim()).filter(Boolean).map(origin => { const parsed = new URL(origin); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error('CORS_ORIGINS must contain HTTP origins'); return origin; }); }
function parseOrigin(value, name) { const parsed = new URL(required(value, name)); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value) throw new Error(`${name} must be an HTTP origin`); return parsed.origin; }
function validCookieName(value) { if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$/.test(value)) throw new Error('SESSION_COOKIE_NAME is invalid'); return value; }
function validReturnPath(value) { return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/'; }
function validAuthorizationResponse(query) { return query && Object.keys(query).every(key => ['code', 'state'].includes(key)) && typeof query.code === 'string' && query.code.length <= 2048 && typeof query.state === 'string' && /^[A-Za-z0-9_-]{32,256}$/.test(query.state); }
function safeRedirectUrl(value) { if (typeof value !== 'string') return null; try { const parsed = new URL(value); return parsed.protocol === 'https:' ? parsed.href : null; } catch { return null; } }
function positiveInteger(value, fallback, name) { if (value === undefined) return fallback; const parsed = Number(value); if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`); return parsed; }
function createLogger() { return { info(event) { console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), ...event })); }, error(event) { console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), ...event })); } }; }

function startServer() {
  const app = createApp();
  const port = positiveInteger(process.env.PORT, 3000, 'PORT');
  const host = process.env.HOST || '127.0.0.1';
  const server = app.listen(port, host, () => console.log(JSON.stringify({ level: 'info', event: 'server_started', host, port })));
  let stopping = false;
  const shutdown = signal => {
    if (stopping) return;
    stopping = true;
    console.log(JSON.stringify({ level: 'info', event: 'server_stopping', signal }));
    const timeout = setTimeout(() => { process.exitCode = 1; server.closeAllConnections(); }, 10000);
    timeout.unref();
    server.close(error => { clearTimeout(timeout); process.exitCode = error ? 1 : 0; });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

if (require.main === module) startServer();

module.exports = { createApp, createAuthenticator, createCsrfProtection, createRateLimiter, loadConfig, startServer };
