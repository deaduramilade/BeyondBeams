'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { acquireLock, writeAtomic } = require('../a2spa-r/replay');
const { HEX_256 } = require('../a2spa-r/canonical');
const { identifier } = require('../a2spa-r/validation');

class FileWorkQueue {
  constructor({ directory, now = Date.now, maxAttempts = 5, leaseMs = 30000 }) {
    if (!path.isAbsolute(directory)) throw new Error('queue directory must be absolute');
    this.file = path.join(directory, 'queue.json');
    this.lock = path.join(directory, '.queue.lock');
    this.now = now;
    this.maxAttempts = maxAttempts;
    this.leaseMs = leaseMs;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  enqueue({ tenant, type, idempotencyKey, payloadDigest, reference }) {
    identifier(tenant, 'queue tenant'); identifier(type, 'queue type');
    identifier(idempotencyKey, 'queue idempotency key'); identifier(reference, 'queue reference');
    if (!HEX_256.test(payloadDigest)) throw queueError('INVALID_QUEUE_ITEM');
    return this.update(state => {
      const keyDigest = hash(`${tenant}\0${type}\0${idempotencyKey}`);
      const existing = state.items.find(item => item.keyDigest === keyDigest);
      if (existing) return { result: { id: existing.id, duplicate: true }, state };
      const item = { id: crypto.randomUUID(), tenant, type, keyDigest, payloadDigest, reference, state: 'pending', attempts: 0, availableAt: this.now(), leaseUntil: null, lastError: null };
      state.items.push(item);
      return { result: { id: item.id, duplicate: false }, state };
    });
  }

  lease(workerId) {
    identifier(workerId, 'queue worker');
    return this.update(state => {
      const now = this.now();
      for (const item of state.items) if (item.state === 'leased' && item.leaseUntil <= now) { item.state = 'pending'; item.leaseUntil = null; }
      const item = state.items.find(candidate => candidate.state === 'pending' && candidate.availableAt <= now);
      if (!item) return { result: null, state };
      item.state = 'leased'; item.workerDigest = hash(workerId); item.leaseUntil = now + this.leaseMs; item.attempts += 1;
      return { result: publicItem(item), state };
    });
  }

  acknowledge(id) {
    return this.transition(id, item => { item.state = 'completed'; item.leaseUntil = null; item.completedAt = this.now(); });
  }

  fail(id, code, retryDelayMs = 0) {
    return this.transition(id, item => {
      item.lastError = safeCode(code); item.leaseUntil = null;
      if (item.attempts >= this.maxAttempts) { item.state = 'dead-letter'; item.deadLetteredAt = this.now(); }
      else { item.state = 'pending'; item.availableAt = this.now() + retryDelayMs; }
    });
  }

  health() {
    try {
      const state = readState(this.file);
      return { available: true, pending: state.items.filter(item => item.state === 'pending').length, deadLetter: state.items.filter(item => item.state === 'dead-letter').length };
    } catch { return { available: false, pending: 0, deadLetter: 0 }; }
  }

  transition(id, operation) {
    return this.update(state => {
      const item = state.items.find(candidate => candidate.id === id && candidate.state === 'leased');
      if (!item) throw queueError('QUEUE_LEASE_NOT_FOUND');
      operation(item);
      return { result: publicItem(item), state };
    });
  }

  update(operation) {
    const release = acquireLock(this.lock, 5000, 30000);
    try {
      const outcome = operation(readState(this.file));
      writeAtomic(this.file, outcome.state);
      return outcome.result;
    } catch (error) {
      if (error.code === 'QUEUE_LEASE_NOT_FOUND') throw error;
      throw queueError('QUEUE_UNAVAILABLE');
    } finally { release(); }
  }
}

function readState(file) {
  try {
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!state || state.schema !== 'oblivion.queue/1' || !Array.isArray(state.items)) throw new Error();
    return state;
  } catch (error) {
    if (error.code === 'ENOENT') return { schema: 'oblivion.queue/1', items: [] };
    throw error;
  }
}

function publicItem(item) {
  const { keyDigest, workerDigest, ...safe } = item;
  return safe;
}
function hash(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function safeCode(value) { return typeof value === 'string' && /^[A-Z0-9_]{1,64}$/.test(value) ? value : 'WORK_FAILED'; }
function queueError(code) { const error = new Error('queue operation failed'); error.code = code; return error; }

module.exports = { FileWorkQueue };