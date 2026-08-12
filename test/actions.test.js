'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { hasActionScope, validateExecuteRequest } = require('../src/actions');

const validRequest = {
  actionType: 'realtime.defense.breach.detect',
  payload: { breachId: 'SYNTHETIC-1', affectedRecords: 10, dataFlow: 'test-flow' }
};

test('accepts a strict valid action request', () => {
  assert.deepEqual(validateExecuteRequest(validRequest), { valid: true });
});

test('rejects unknown actions, fields, and invalid values', () => {
  assert.equal(validateExecuteRequest({ ...validRequest, actionType: 'realtime.defense.anything' }).valid, false);
  assert.equal(validateExecuteRequest({ ...validRequest, extra: true }).valid, false);
  assert.equal(validateExecuteRequest({ ...validRequest, payload: { ...validRequest.payload, secret: true } }).valid, false);
  assert.equal(validateExecuteRequest({ ...validRequest, payload: { ...validRequest.payload, affectedRecords: -1 } }).valid, false);
});

test('matches wildcard and exact action scopes only', () => {
  assert.equal(hasActionScope(['action:*'], validRequest.actionType), true);
  assert.equal(hasActionScope(['action:realtime.defense.breach.detect'], validRequest.actionType), true);
  assert.equal(hasActionScope(['action:rights.management.exercise'], validRequest.actionType), false);
});