'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { digest } = require('../a2spa-r/canonical');
const { acquireLock } = require('../a2spa-r/replay');

const GENESIS = '0'.repeat(64);

class AuditLedger {
  constructor({ directory, now = Date.now, lockTimeoutMs = 5000, staleLockMs = 30000 }) {
    if (!path.isAbsolute(directory)) throw new Error('audit directory must be absolute');
    this.directory = directory;
    this.file = path.join(directory, 'ledger.ndjson');
    this.lock = path.join(directory, '.ledger.lock');
    this.now = now;
    this.lockTimeoutMs = lockTimeoutMs;
    this.staleLockMs = staleLockMs;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  append(type, data) {
    const release = acquireLock(this.lock, this.lockTimeoutMs, this.staleLockMs);
    try {
      const records = readRecords(this.file);
      const verification = verifyRecords(records);
      if (!verification.valid) throw ledgerError('AUDIT_INTEGRITY_FAILURE');
      const previousDigest = records.length ? records[records.length - 1].recordDigest : GENESIS;
      const unsigned = {
        schema: 'oblivion.audit/1',
        sequence: records.length + 1,
        eventId: crypto.randomUUID(),
        timestamp: new Date(this.now()).toISOString(),
        type,
        previousDigest,
        data
      };
      const record = { ...unsigned, recordDigest: digest(unsigned, 'audit-record') };
      fs.appendFileSync(this.file, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
      return record;
    } catch (error) {
      if (error.code) throw error;
      throw ledgerError('AUDIT_STORE_UNAVAILABLE');
    } finally { release(); }
  }

  verify() {
    try { return verifyRecords(readRecords(this.file)); }
    catch (error) { return { valid: false, reason: error.code || 'AUDIT_STORE_UNAVAILABLE' }; }
  }

  export({ tenantId }) {
    const records = readRecords(this.file);
    const verification = verifyRecords(records);
    if (!verification.valid) throw ledgerError('AUDIT_INTEGRITY_FAILURE');
    return {
      schema: 'oblivion.audit-export/1',
      generatedAt: new Date(this.now()).toISOString(),
      tenantId,
      records: records.filter(record => record.data.tenant === tenantId),
      chain: { recordCount: records.length, headDigest: verification.headDigest }
    };
  }

  enforceRetention({ before, classes, legalHold = false }) {
    if (legalHold) throw ledgerError('LEGAL_HOLD_ACTIVE');
    if (!Array.isArray(classes) || classes.length === 0) throw ledgerError('INVALID_RETENTION_REQUEST');
    const cutoff = Date.parse(before);
    if (Number.isNaN(cutoff)) throw ledgerError('INVALID_RETENTION_REQUEST');
    const candidates = readRecords(this.file).filter(record => classes.includes(record.data.retentionClass) &&
      Date.parse(record.timestamp) < cutoff && !record.data.legalHold).map(record => record.eventId);
    const disposition = this.append('retention_disposition', {
      tenant: 'system', retentionClass: 'audit-control', legalHold: false,
      before: new Date(cutoff).toISOString(), classes, candidateDigest: digest(candidates, 'retention-candidates'), candidateCount: candidates.length
    });
    return { dispositionId: disposition.eventId, candidateCount: candidates.length, physicalDeletion: 'external_approval_required' };
  }
}

function verifyRecords(records) {
  let previous = GENESIS;
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const { recordDigest, ...unsigned } = record;
    if (record.sequence !== index + 1 || record.previousDigest !== previous || digest(unsigned, 'audit-record') !== recordDigest) {
      return { valid: false, reason: 'AUDIT_INTEGRITY_FAILURE', index };
    }
    previous = recordDigest;
  }
  return { valid: true, recordCount: records.length, headDigest: previous };
}

function readRecords(file) {
  try {
    const contents = fs.readFileSync(file, 'utf8');
    return contents.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw ledgerError('AUDIT_STORE_UNAVAILABLE');
  }
}

function ledgerError(code) { const error = new Error('audit ledger operation failed'); error.code = code; return error; }

module.exports = { AuditLedger, verifyRecords };