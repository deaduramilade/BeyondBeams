'use strict';

const crypto = require('crypto');
const { signObject } = require('../a2spa-r/crypto');
const { digest } = require('../a2spa-r/canonical');
const { validateProviderContracts } = require('./contracts');

class SyntheticIdentityProvider {
  constructor({ issuer = 'https://identity.synthetic.invalid', clientId = 'beyondbeams-synthetic', redirectUri = 'https://app.synthetic.invalid/auth/callback', now = Date.now, sessionTtlMs = 900000 } = {}) {
    this.issuer = issuer; this.clientId = clientId; this.redirectUri = redirectUri; this.now = now; this.sessionTtlMs = sessionTtlMs;
    this.transactions = new Map(); this.sessions = new Map(); this.revoked = new Set();
  }
  beginAuthorization({ returnTo = '/' } = {}) {
    if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) throw providerError('INVALID_RETURN_PATH');
    const state = random(), nonce = random(), verifier = random(64), challenge = sha256(verifier, 'base64url');
    this.transactions.set(state, { nonce, verifier, returnTo, expiresAt: this.now() + 300000 });
    const url = new URL(`${this.issuer}/authorize`);
    Object.entries({ response_type: 'code', client_id: this.clientId, redirect_uri: this.redirectUri, scope: 'openid profile', state, nonce, code_challenge: challenge, code_challenge_method: 'S256' }).forEach(([key, value]) => url.searchParams.set(key, value));
    return { authorizationUrl: url.href, state };
  }
  completeAuthorization({ state, code, exchange }) {
    const transaction = this.transactions.get(state); this.transactions.delete(state);
    if (!transaction || transaction.expiresAt <= this.now()) throw providerError('INVALID_OIDC_STATE');
    if (typeof exchange !== 'function') throw providerError('TOKEN_EXCHANGE_REQUIRED');
    const result = exchange({ code, codeVerifier: transaction.verifier, redirectUri: this.redirectUri });
    if (!result || result.nonce !== transaction.nonce || !validPrincipal(result.principal)) throw providerError('INVALID_OIDC_CALLBACK');
    const id = random(48), expiresAt = this.now() + this.sessionTtlMs;
    this.sessions.set(id, { principal: clone(result.principal), expiresAt, generation: 1 });
    return { sessionId: id, expiresAt: new Date(expiresAt).toISOString(), returnTo: transaction.returnTo };
  }
  authenticateSession(id) {
    const session = this.sessions.get(id);
    if (!session || this.revoked.has(id) || session.expiresAt <= this.now()) throw providerError('INVALID_SESSION');
    return clone(session.principal);
  }
  rotateSession(id) {
    const principal = this.authenticateSession(id), previous = this.sessions.get(id); this.revoke({ sessionId: id });
    const sessionId = random(48), expiresAt = this.now() + this.sessionTtlMs;
    this.sessions.set(sessionId, { principal, expiresAt, generation: previous.generation + 1 });
    return { sessionId, expiresAt: new Date(expiresAt).toISOString() };
  }
  issueCsrfToken(id) { this.authenticateSession(id); return hmac(id, random(32)); }
  verifyCsrfToken(id, token) { this.authenticateSession(id); if (typeof token !== 'string' || !timingEqual(token, hmac(id, token.slice(65)))) throw providerError('INVALID_CSRF_TOKEN'); return true; }
  logout(id) { this.revoke({ sessionId: id }); return { providerLogoutUrl: `${this.issuer}/logout`, localSessionRevoked: true }; }
  revoke({ sessionId }) { if (sessionId) { this.revoked.add(sessionId); this.sessions.delete(sessionId); } return true; }
}

class SyntheticManagedKeyProvider {
  constructor() { this.keys = new Map(); this.active = null; this.rotate(); }
  status(keyId = this.active) { const key = this.keys.get(keyId); return { available: Boolean(key && !key.revoked), state: key && !key.revoked ? 'active' : 'revoked', keyId }; }
  sign({ keyId = this.active, value }) { const key = this.keys.get(keyId); if (!key || key.revoked) throw providerError('KEY_UNAVAILABLE'); return { keyId, signature: signObject(value, key.privateKey) }; }
  rotate() { const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } }); const keyId = `synthetic-key-${crypto.randomUUID()}`; this.keys.set(keyId, { ...pair, revoked: false }); this.active = keyId; return { keyId, publicKey: pair.publicKey }; }
  revoke(keyId) { const key = this.keys.get(keyId); if (!key) throw providerError('KEY_NOT_FOUND'); key.revoked = true; return true; }
}

class SyntheticPersistenceProvider {
  constructor() { this.state = { records: {}, outbox: [] }; this.version = 1; this.backups = new Map(); }
  transaction(operation) { const working = clone(this.state); const result = operation({ records: working.records, outbox: working.outbox }); this.state = working; return clone(result); }
  read(key) { return clone(this.state.records[key] || null); }
  backup() { const id = `backup_${crypto.randomUUID()}`; this.backups.set(id, clone(this.state)); return { id, digest: digest(this.state, 'synthetic-backup') }; }
  restore(id) { if (!this.backups.has(id)) throw providerError('BACKUP_NOT_FOUND'); this.state = clone(this.backups.get(id)); return { restored: true, digest: digest(this.state, 'synthetic-backup') }; }
  migrate(target, operation) { if (!Number.isSafeInteger(target) || target !== this.version + 1) throw providerError('INVALID_MIGRATION'); this.transaction(operation); this.version = target; return { version: target }; }
}

class SyntheticQueueProvider {
  constructor({ maxAttempts = 3, now = Date.now } = {}) { this.items = []; this.maxAttempts = maxAttempts; this.now = now; }
  enqueue(item) { const existing = this.items.find(value => value.idempotencyKey === item.idempotencyKey); if (existing) return { id: existing.id, duplicate: true }; const record = { ...clone(item), id: crypto.randomUUID(), state: 'pending', attempts: 0 }; this.items.push(record); return { id: record.id, duplicate: false }; }
  lease(worker) { const item = this.items.find(value => value.state === 'pending'); if (!item) return null; item.state = 'leased'; item.worker = sha256(worker); item.attempts += 1; item.leasedAt = this.now(); return clone(item); }
  acknowledge(id) { return this.change(id, item => { item.state = 'completed'; }); }
  fail(id, code) { return this.change(id, item => { item.error = safeCode(code); item.state = item.attempts >= this.maxAttempts ? 'dead-letter' : 'pending'; }); }
  health() { return { available: true, pending: this.items.filter(item => item.state === 'pending').length, deadLetter: this.items.filter(item => item.state === 'dead-letter').length }; }
  change(id, operation) { const item = this.items.find(value => value.id === id && value.state === 'leased'); if (!item) throw providerError('QUEUE_LEASE_NOT_FOUND'); operation(item); return clone(item); }
}

class SyntheticScannerProvider { scan({ content }) { const infected = Buffer.from(content).includes(Buffer.from('SYNTHETIC-MALWARE')); return { status: infected ? 'rejected' : 'clean', engine: 'synthetic-scanner', signatureVersion: 'synthetic-1' }; } }

class SyntheticRecordsProvider {
  constructor({ scanner, now = Date.now } = {}) { this.scanner = scanner; this.now = now; this.records = new Map(); }
  putImmutable({ tenant, content, mediaType, retentionUntil, legalHold = false }) { const scan = this.scanner.scan({ content, mediaType }); if (scan.status !== 'clean') throw providerError('MALWARE_REJECTED'); const id = `record_${crypto.randomUUID()}`, bytes = Buffer.from(content); const record = { id, tenant, mediaType, content: bytes.toString('base64'), digest: sha256(bytes), retentionUntil, legalHold, scan, createdAt: this.now() }; this.records.set(id, record); return publicRecord(record); }
  get(tenant, id) { const record = this.records.get(id); if (!record || record.tenant !== tenant) throw providerError('RECORD_NOT_FOUND'); return publicRecord(record); }
  applyRetention(tenant, id, retentionUntil) { const record = this.require(tenant, id); if (Date.parse(retentionUntil) < record.createdAt) throw providerError('INVALID_RETENTION'); record.retentionUntil = retentionUntil; return publicRecord(record); }
  placeLegalHold(tenant, id, value = true) { const record = this.require(tenant, id); record.legalHold = Boolean(value); return publicRecord(record); }
  deleteExpired(now = this.now()) { let deleted = 0; for (const [id, record] of this.records) if (!record.legalHold && Date.parse(record.retentionUntil) <= now) { this.records.delete(id); deleted += 1; } return deleted; }
  require(tenant, id) { const record = this.records.get(id); if (!record || record.tenant !== tenant) throw providerError('RECORD_NOT_FOUND'); return record; }
}

class SyntheticNotificationProvider {
  constructor() { this.deliveries = new Map(); }
  send({ tenant, template, locale, destinationRef, idempotencyKey }) { const duplicate = [...this.deliveries.values()].find(item => item.tenant === tenant && item.idempotencyKey === idempotencyKey); if (duplicate) return { ...clone(duplicate), duplicate: true }; const record = { deliveryId: `delivery_${crypto.randomUUID()}`, tenant, template, locale, destinationDigest: sha256(destinationRef), idempotencyKey, status: 'delivered', providerReceipt: random(32) }; this.deliveries.set(record.deliveryId, record); return clone(record); }
  receipt(id) { const record = this.deliveries.get(id); if (!record) throw providerError('DELIVERY_NOT_FOUND'); return clone(record); }
}

class SyntheticDocumentProvider {
  generate({ title, language, sections }) { if (!title || !language || !Array.isArray(sections)) throw providerError('INVALID_DOCUMENT'); const document = { schema: 'beyondbeams.synthetic-document/1', title, language, sections: clone(sections) }; return { document, digest: digest(document, 'synthetic-document') }; }
  validateAccessibility({ document }) { const findings = []; if (!document.language) findings.push('LANGUAGE_REQUIRED'); if (!document.title) findings.push('TITLE_REQUIRED'); if (!document.sections.length || document.sections.some(section => !section.heading || !section.body)) findings.push('STRUCTURE_REQUIRED'); return { valid: findings.length === 0, findings, scope: 'structural-synthetic-check-only' }; }
}

class SyntheticPolicyProvider {
  constructor() { this.policies = new Map(); this.active = null; }
  publish(pack) { const key = `${pack.id}@${pack.version}`; if (this.policies.has(key)) throw providerError('DUPLICATE_POLICY'); this.policies.set(key, { pack: clone(pack), revoked: false }); return { key }; }
  activate(id, version) { const key = `${id}@${version}`, item = this.policies.get(key); if (!item || item.revoked) throw providerError('POLICY_UNAVAILABLE'); this.active = key; return this.status(); }
  revoke(id, version) { const item = this.policies.get(`${id}@${version}`); if (!item) throw providerError('POLICY_NOT_FOUND'); item.revoked = true; if (this.active === `${id}@${version}`) this.active = null; return true; }
  status() { return { ready: Boolean(this.active), active: this.active }; }
}

class SyntheticTelemetryProvider {
  constructor({ now = Date.now, clock = Date.now, alertRules = [] } = {}) { this.now = now; this.clock = clock; this.alertRules = alertRules; this.events = []; this.measures = new Map(); }
  emit(event) { const safe = clone(event); for (const forbidden of ['token', 'credential', 'payload', 'privateKey', 'personalData']) if (Object.hasOwn(safe, forbidden)) throw providerError('SENSITIVE_TELEMETRY_REJECTED'); this.events.push({ ...safe, at: this.now() }); return true; }
  measureClock(referenceMs) { const offsetMs = this.clock() - referenceMs; this.measures.set('clock_offset_ms', offsetMs); return { offsetMs, synchronized: Math.abs(offsetMs) <= 1000 }; }
  evaluateAlerts() { return this.alertRules.filter(rule => rule.test(this.measures, this.events)).map(rule => ({ code: rule.code, severity: rule.severity, runbook: rule.runbook })); }
  health() { return { available: true, events: this.events.length }; }
}

function createSyntheticPlatform(options = {}) {
  const scanner = new SyntheticScannerProvider();
  const providers = { identity: new SyntheticIdentityProvider(options.identity), signer: new SyntheticManagedKeyProvider(), persistence: new SyntheticPersistenceProvider(), queue: new SyntheticQueueProvider(options.queue), scanner, records: new SyntheticRecordsProvider({ scanner, ...options.records }), notifications: new SyntheticNotificationProvider(), documents: new SyntheticDocumentProvider(), policy: new SyntheticPolicyProvider(), telemetry: new SyntheticTelemetryProvider(options.telemetry) };
  validateProviderContracts(providers); return providers;
}

function validPrincipal(value) { return value && ['human', 'service', 'agent'].includes(value.type) && ['id', 'tenantId', 'workloadId'].every(field => typeof value[field] === 'string' && value[field]); }
function publicRecord(record) { const { content, ...metadata } = record; return clone(metadata); }
function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
function random(bytes = 32) { return crypto.randomBytes(bytes).toString('base64url'); }
function sha256(value, encoding = 'hex') { return crypto.createHash('sha256').update(value).digest(encoding); }
function hmac(sessionId, secret) { return `${crypto.createHmac('sha256', sessionId).update(secret).digest('hex')}.${secret}`; }
function timingEqual(left, right) { const a = Buffer.from(left), b = Buffer.from(right); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function safeCode(value) { return typeof value === 'string' && /^[A-Z0-9_]{1,64}$/.test(value) ? value : 'WORK_FAILED'; }
function providerError(code) { const error = new Error('synthetic provider operation failed'); error.code = code; return error; }

module.exports = { SyntheticIdentityProvider, SyntheticManagedKeyProvider, SyntheticPersistenceProvider, SyntheticQueueProvider, SyntheticScannerProvider, SyntheticRecordsProvider, SyntheticNotificationProvider, SyntheticDocumentProvider, SyntheticPolicyProvider, SyntheticTelemetryProvider, createSyntheticPlatform };
