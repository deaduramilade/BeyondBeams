'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { CaseStore } = require('../src/cases/store');

test('persists tenant-isolated cases and complete status history', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-cases-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new CaseStore({ directory, now: () => Date.parse('2026-08-12T00:00:00.000Z') });
  const record = store.create({ tenantId: 'tenant-a', actorId: 'requester-a', actionType: 'regulatory.oversight.perform', payload: { controller: 'Synthetic Authority' }, inputMethod: 'json' });
  store.transition({ tenantId: 'tenant-a', caseId: record.caseId, actorId: 'requester-a', actorRoles: ['requester'], target: 'submitted' });
  assert.equal(new CaseStore({ directory }).get('tenant-a', record.caseId).timeline.length, 2);
  assert.equal(store.get('tenant-b', record.caseId), null);
  assert.deepEqual(store.list('tenant-b'), []);
});

test('enforces transition order, separation of duties, and assignment conflicts', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-cases-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new CaseStore({ directory }); const record = store.create({ tenantId: 'tenant-a', actorId: 'requester-a', actionType: 'regulatory.oversight.perform', payload: { controller: 'Synthetic Authority' } });
  assert.throws(() => store.transition({ tenantId: 'tenant-a', caseId: record.caseId, actorId: 'requester-a', actorRoles: ['requester'], target: 'approved' }), { code: 'INVALID_CASE_TRANSITION' });
  store.transition({ tenantId: 'tenant-a', caseId: record.caseId, actorId: 'requester-a', actorRoles: ['requester'], target: 'submitted' });
  store.transition({ tenantId: 'tenant-a', caseId: record.caseId, actorId: 'triager-a', actorRoles: ['reviewer'], target: 'triage' });
  assert.throws(() => store.transition({ tenantId: 'tenant-a', caseId: record.caseId, actorId: 'triager-a', actorRoles: ['reviewer'], target: 'assigned', assignedTo: 'requester-a' }), { code: 'CONFLICT_OF_INTEREST' });
});

test('supports queues, assignments, deadlines, notes, evidence, suspension, and resume', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-cases-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let now = Date.parse('2026-08-12T00:00:00.000Z'); const store = new CaseStore({ directory, now: () => now });
  const item = store.create({ tenantId: 'tenant-a', actorId: 'requester-a', actionType: 'regulatory.oversight.perform', payload: { controller: 'Synthetic Authority' } });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'requester-a', actorRoles: ['requester'], target: 'submitted' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'triage' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'assigned', assignedTo: 'reviewer-b' });
  store.assign({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'admin-a', actorRoles: ['administrator'], assignedTo: 'reviewer-c', reason: 'coverage' });
  store.schedule({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], deadlineAt: '2026-08-13T00:00:00Z', priority: 'urgent' });
  store.escalate({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], reason: 'deadline risk' });
  store.addNote({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], text: 'Synthetic note' });
  store.addEvidence({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], evidence: { name: 'scan.txt', mediaType: 'text/plain', size: 4, digest: 'a'.repeat(64), storageRef: 'evidence://synthetic/1', scanStatus: 'clean' } });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'suspended' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'assigned' });
  now = Date.parse('2026-08-14T00:00:00.000Z'); const result = store.get('tenant-a', item.caseId);
  assert.equal(result.assignmentHistory.length, 2); assert.equal(result.notes.length, 1); assert.equal(result.evidence.length, 1); assert.equal(result.escalationLevel, 1);
  assert.equal(store.list('tenant-a', { assignedTo: 'reviewer-c', overdue: true }).length, 1);
});

test('requires reasoned decision and override records', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-cases-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new CaseStore({ directory }); const item = store.create({ tenantId: 'tenant-a', actorId: 'requester-a', actionType: 'regulatory.oversight.perform', payload: { controller: 'Synthetic Authority' } });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'requester-a', actorRoles: ['requester'], target: 'submitted' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'triage' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'assigned', assignedTo: 'reviewer-a' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'recommendation' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'reviewer-a', actorRoles: ['reviewer'], target: 'pending_review' });
  assert.throws(() => store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'approver-a', actorRoles: ['approver'], target: 'approved' }), { code: 'CASE_RECORD_REQUIRED' });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'approver-a', actorRoles: ['approver'], target: 'approved', record: { reasonCode: 'APPROVED_01', explanation: 'Synthetic approval', outcome: 'approved' } });
  store.transition({ tenantId: 'tenant-a', caseId: item.caseId, actorId: 'admin-a', actorRoles: ['administrator'], target: 'override', record: { reasonCode: 'OVERRIDE_01', explanation: 'Temporary synthetic override', expiresAt: '2099-01-01T00:00:00Z' } });
  assert.equal(store.get('tenant-a', item.caseId).records.length, 2);
});
