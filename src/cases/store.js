'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { acquireLock, writeAtomic } = require('../a2spa-r/replay');

const STATES = Object.freeze(['draft', 'submitted', 'triage', 'assigned', 'recommendation', 'pending_review', 'approved', 'denied', 'notice', 'correction', 'objection', 'appeal', 'remedy', 'override', 'suspended', 'closed', 'cancelled']);
const TRANSITIONS = {
  draft: ['submitted', 'closed'], submitted: ['triage', 'closed'], triage: ['assigned', 'closed'], assigned: ['recommendation', 'closed'],
  recommendation: ['pending_review', 'closed'], pending_review: ['approved', 'denied', 'correction', 'appeal', 'closed'], approved: ['notice', 'override', 'closed'],
  denied: ['notice', 'correction', 'appeal', 'closed'], notice: ['correction', 'objection', 'appeal', 'remedy', 'closed'], correction: ['pending_review', 'closed'],
  objection: ['pending_review', 'appeal', 'closed'], appeal: ['remedy', 'approved', 'denied', 'closed'], remedy: ['notice', 'closed'], override: ['notice', 'closed'],
  suspended: ['submitted', 'triage', 'assigned', 'recommendation', 'pending_review', 'notice', 'correction', 'objection', 'appeal', 'remedy', 'closed', 'cancelled'], closed: [], cancelled: []
};
for (const state of Object.keys(TRANSITIONS)) if (!['closed', 'cancelled', 'suspended'].includes(state)) TRANSITIONS[state] = Object.freeze([...new Set([...TRANSITIONS[state], 'suspended'])]);
Object.freeze(TRANSITIONS);
const TARGET_ROLES = Object.freeze({ triage: ['reviewer', 'administrator'], assigned: ['reviewer', 'administrator'], recommendation: ['reviewer'], pending_review: ['reviewer'], approved: ['approver'], denied: ['approver'], notice: ['support', 'reviewer'], correction: ['support', 'reviewer'], objection: ['support', 'reviewer'], appeal: ['reviewer', 'support'], remedy: ['approver', 'support'], override: ['administrator'], suspended: ['reviewer', 'administrator'], closed: ['reviewer', 'approver', 'support', 'administrator'], cancelled: ['requester', 'reviewer', 'administrator'] });
const RECORD_TARGETS = new Set(['approved', 'denied', 'notice', 'correction', 'objection', 'appeal', 'remedy', 'override']);
const OPERATOR_ROLES = new Set(['reviewer', 'approver', 'support', 'administrator']);

class CaseStore {
  constructor({ directory, now = () => Date.now() }) {
    if (!path.isAbsolute(directory)) throw new Error('case directory must be absolute');
    this.file = path.join(directory, 'cases.json');
    this.lock = path.join(directory, '.cases.lock');
    this.now = now;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  create({ tenantId, actorId, actionType, payload, inputMethod = 'guided' }) {
    requiredIdentifier(tenantId); requiredIdentifier(actorId); requiredText(actionType, 200);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !['guided', 'json'].includes(inputMethod)) throw caseError('INVALID_CASE_INPUT');
    const timestamp = this.timestamp();
    const record = { caseId: `case_${crypto.randomUUID()}`, tenantId, actionType, payload: clone(payload), inputMethod, state: 'draft', requesterId: actorId, assignedTo: null, assignmentHistory: [], priority: 'normal', deadlineAt: null, escalationLevel: 0, suspendedFrom: null, decision: null, records: [], notes: [], evidence: [], timeline: [{ state: 'draft', actorId, at: timestamp }], createdAt: timestamp, updatedAt: timestamp };
    this.updateRecords(records => { records.push(record); return record; });
    return clone(record);
  }

  get(tenantId, caseId) { return clone(readRecords(this.file).find(item => item.tenantId === tenantId && item.caseId === caseId) || null); }
  list(tenantId, filters = {}) {
    let records = readRecords(this.file).filter(item => item.tenantId === tenantId);
    for (const name of ['state', 'assignedTo', 'requesterId', 'priority']) if (filters[name]) records = records.filter(item => item[name] === filters[name]);
    if (filters.overdue === true) records = records.filter(item => item.deadlineAt && Date.parse(item.deadlineAt) < this.now() && !['closed', 'cancelled'].includes(item.state));
    if (filters.query) { const query = filters.query.toLowerCase(); records = records.filter(item => `${item.caseId} ${item.actionType} ${item.state}`.toLowerCase().includes(query)); }
    const direction = filters.order === 'asc' ? 1 : -1;
    records.sort((a, b) => direction * String(a.updatedAt).localeCompare(String(b.updatedAt)));
    return records.map(clone);
  }

  transition({ tenantId, caseId, actorId, actorRoles, target, record: domainInput = null, decision = null, assignedTo = null }) {
    return this.updateRecords(records => {
      const record = records.find(item => item.tenantId === tenantId && item.caseId === caseId);
      if (!record) throw caseError('CASE_NOT_FOUND');
      if (!STATES.includes(target) || !TRANSITIONS[record.state].includes(target)) throw caseError('INVALID_CASE_TRANSITION');
      if (!Array.isArray(actorRoles) || !actorRoles.length) throw caseError('CASE_ROLE_REQUIRED');
      if (TARGET_ROLES[target] && !actorRoles.some(role => TARGET_ROLES[target].includes(role))) throw caseError('CASE_ROLE_REQUIRED');
      if (['pending_review', 'approved', 'denied', 'appeal', 'remedy', 'override'].includes(target) && actorId === record.requesterId) throw caseError('SEPARATION_OF_DUTIES_REQUIRED');
      if (target === 'assigned' && record.state !== 'suspended') this.applyAssignment(record, actorId, assignedTo);
      if (target === 'suspended') record.suspendedFrom = record.state;
      if (record.state === 'suspended' && !['closed', 'cancelled'].includes(target)) { if (target !== record.suspendedFrom) throw caseError('INVALID_RESUME_TARGET'); record.suspendedFrom = null; }
      const at = this.timestamp();
      const suppliedRecord = domainInput === null ? decision : domainInput;
      const domainRecord = RECORD_TARGETS.has(target) ? validateDomainRecord(target, suppliedRecord, actorId, at) : null;
      record.state = target;
      if (domainRecord) { record.records.push(domainRecord); if (['approved', 'denied', 'override'].includes(target)) record.decision = domainRecord; }
      record.timeline.push({ state: target, actorId, at, ...(domainRecord ? { recordId: domainRecord.recordId, reasonCode: domainRecord.reasonCode } : {}) });
      record.updatedAt = at;
      return record;
    });
  }

  assign({ tenantId, caseId, actorId, actorRoles, assignedTo, reason = 'reassignment' }) { return this.change(tenantId, caseId, item => { requireOperator(actorRoles); this.applyAssignment(item, actorId, assignedTo, reason); }); }
  schedule({ tenantId, caseId, actorId, actorRoles, deadlineAt, priority = 'normal' }) { return this.change(tenantId, caseId, item => { requireOperator(actorRoles); const parsed = Date.parse(deadlineAt); if (!['low', 'normal', 'high', 'urgent'].includes(priority) || !Number.isFinite(parsed) || parsed <= this.now()) throw caseError('INVALID_CASE_SCHEDULE'); item.deadlineAt = new Date(parsed).toISOString(); item.priority = priority; item.timeline.push({ event: 'scheduled', actorId, at: this.timestamp(), deadlineAt: item.deadlineAt, priority }); }); }
  escalate({ tenantId, caseId, actorId, actorRoles, reason }) { return this.change(tenantId, caseId, item => { requireOperator(actorRoles); requiredText(reason, 1000); item.escalationLevel += 1; item.timeline.push({ event: 'escalated', actorId, at: this.timestamp(), level: item.escalationLevel, reason }); }); }
  addNote({ tenantId, caseId, actorId, actorRoles, text, visibility = 'internal' }) { return this.change(tenantId, caseId, item => { requireRoles(actorRoles); requiredText(text, 4000); if (!['internal', 'requester'].includes(visibility) || visibility === 'internal' && !actorRoles.some(role => OPERATOR_ROLES.has(role))) throw caseError('CASE_ROLE_REQUIRED'); item.notes.push({ noteId: `note_${crypto.randomUUID()}`, actorId, text: text.trim(), visibility, at: this.timestamp() }); }); }
  addEvidence({ tenantId, caseId, actorId, actorRoles, evidence }) { return this.change(tenantId, caseId, item => { requireRoles(actorRoles); item.evidence.push(validateEvidence(evidence, actorId, this.timestamp())); }); }

  applyAssignment(item, actorId, assignedTo, reason = 'workflow-assignment') { requiredIdentifier(assignedTo); if (assignedTo === item.requesterId) throw caseError('CONFLICT_OF_INTEREST'); const at = this.timestamp(); item.assignedTo = assignedTo; item.assignmentHistory.push({ assignedTo, actorId, reason: requiredText(reason, 1000), at }); item.timeline.push({ event: 'assigned', actorId, assignedTo, at }); }
  change(tenantId, caseId, operation) { return this.updateRecords(records => { const item = records.find(candidate => candidate.tenantId === tenantId && candidate.caseId === caseId); if (!item) throw caseError('CASE_NOT_FOUND'); operation(item); item.updatedAt = this.timestamp(); return item; }); }
  timestamp() { return new Date(this.now()).toISOString(); }

  updateRecords(operation) {
    const release = acquireLock(this.lock, 5000, 30000);
    try { const records = readRecords(this.file); const result = operation(records); writeAtomic(this.file, records); return clone(result); }
    finally { release(); }
  }
}

function readRecords(file) {
  try { const value = JSON.parse(fs.readFileSync(file, 'utf8')); if (!Array.isArray(value)) throw new Error(); return value; }
  catch (error) { if (error.code === 'ENOENT') return []; throw caseError('CASE_STORE_UNAVAILABLE'); }
}
function clone(value) { return value === null ? null : JSON.parse(JSON.stringify(value)); }
function caseError(code) { const error = new Error('case operation failed'); error.code = code; return error; }
function requireRoles(roles) { if (!Array.isArray(roles) || !roles.length) throw caseError('CASE_ROLE_REQUIRED'); }
function requireOperator(roles) { requireRoles(roles); if (!roles.some(role => OPERATOR_ROLES.has(role))) throw caseError('CASE_ROLE_REQUIRED'); }
function requiredIdentifier(value) { if (typeof value !== 'string' || !/^[A-Za-z0-9._:@/-]{1,200}$/.test(value)) throw caseError('INVALID_CASE_INPUT'); return value; }
function requiredText(value, max) { if (typeof value !== 'string' || !value.trim() || value.length > max) throw caseError('INVALID_CASE_INPUT'); return value.trim(); }
function validateDomainRecord(type, value, actorId, at) { if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.reasonCode !== 'string' || !/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(value.reasonCode)) throw caseError('CASE_RECORD_REQUIRED'); const result = { recordId: `record_${crypto.randomUUID()}`, type, reasonCode: value.reasonCode, explanation: requiredText(value.explanation, 4000), actorId, at }; if (value.outcome) result.outcome = requiredText(value.outcome, 200); if (value.noticeMethod) result.noticeMethod = requiredText(value.noticeMethod, 100); if (value.expiresAt) { const parsed = Date.parse(value.expiresAt); if (!Number.isFinite(parsed)) throw caseError('INVALID_CASE_RECORD'); result.expiresAt = new Date(parsed).toISOString(); } if (type === 'override' && !result.expiresAt) throw caseError('INVALID_CASE_RECORD'); return result; }
function validateEvidence(value, actorId, at) { if (!value || typeof value !== 'object' || !/^[0-9a-f]{64}$/.test(value.digest || '') || !Number.isSafeInteger(value.size) || value.size < 0) throw caseError('INVALID_EVIDENCE'); return { evidenceId: `evidence_${crypto.randomUUID()}`, name: requiredText(value.name, 255), mediaType: requiredText(value.mediaType, 100), size: value.size, digest: value.digest, storageRef: requiredText(value.storageRef, 500), scanStatus: ['pending', 'clean', 'rejected'].includes(value.scanStatus) ? value.scanStatus : 'pending', actorId, at }; }

module.exports = { CaseStore, STATES, TRANSITIONS };