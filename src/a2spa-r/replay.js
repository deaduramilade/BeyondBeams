'use strict';

const fs = require('fs');
const path = require('path');
const { fail } = require('./errors');

class InMemoryReplayStore {
  constructor({ now = Date.now } = {}) {
    this.now = now;
    this.entries = new Map();
  }

  consume(key, expiresAt) {
    this.purge();
    if (this.entries.has(key)) fail('REPLAYED_AUTHORIZATION', 'authorization has already been consumed');
    this.entries.set(key, expiresAt);
    return true;
  }

  purge() {
    const now = this.now();
    for (const [key, expiresAt] of this.entries) if (expiresAt <= now) this.entries.delete(key);
  }
}

class FileReplayStore {
  constructor({ directory, now = Date.now, lockTimeoutMs = 5000, staleLockMs = 30000 }) {
    if (!path.isAbsolute(directory)) throw new Error('replay store directory must be absolute');
    this.directory = directory;
    this.file = path.join(directory, 'nonces.json');
    this.lock = path.join(directory, '.nonces.lock');
    this.now = now;
    this.lockTimeoutMs = lockTimeoutMs;
    this.staleLockMs = staleLockMs;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  consume(key, expiresAt) {
    const release = acquireLock(this.lock, this.lockTimeoutMs, this.staleLockMs);
    try {
      const entries = readEntries(this.file);
      const current = this.now();
      for (const [candidate, expiry] of Object.entries(entries)) if (expiry <= current) delete entries[candidate];
      const storageKey = require('crypto').createHash('sha256').update(key).digest('hex');
      if (entries[storageKey]) fail('REPLAYED_AUTHORIZATION', 'authorization has already been consumed');
      entries[storageKey] = expiresAt;
      writeAtomic(this.file, entries);
      return true;
    } catch (error) {
      if (error.code === 'REPLAYED_AUTHORIZATION') throw error;
      fail('REPLAY_STORE_UNAVAILABLE', 'authorization replay store is unavailable');
    } finally { release(); }
  }
}

function acquireLock(lock, timeoutMs, staleMs) {
  const started = Date.now();
  while (true) {
    try {
      const descriptor = fs.openSync(lock, 'wx', 0o600);
      fs.writeFileSync(descriptor, String(process.pid));
      return () => { try { fs.closeSync(descriptor); } finally { try { fs.unlinkSync(lock); } catch {} } };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > staleMs) { fs.unlinkSync(lock); continue; }
      } catch (candidate) { if (candidate.code !== 'ENOENT') throw candidate; }
      if (Date.now() - started >= timeoutMs) throw new Error('lock timeout');
      sleep(10);
    }
  }
}

function sleep(milliseconds) {
  const buffer = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buffer), 0, 0, milliseconds);
}

function readEntries(file) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(expiry => !Number.isSafeInteger(expiry))) throw new Error();
    return value;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

function writeAtomic(file, value) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally { try { fs.unlinkSync(temporary); } catch {} }
}

module.exports = { FileReplayStore, InMemoryReplayStore, acquireLock, writeAtomic };