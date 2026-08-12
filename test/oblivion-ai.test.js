'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const oblivionAI = require('../src/OblivionAI');

const actions = [
  ['realtime.defense.breach.detect', { breachId: 'SYNTHETIC-1', affectedRecords: 1, dataFlow: 'test' }],
  ['compliance.automation.dpia.generate', { projectName: 'Synthetic project', riskLevel: 'Low' }],
  ['predictive.analytics.risk.model', { dataFlow: 'test', riskScore: 'LOW' }],
  ['regulatory.oversight.perform', { controller: 'Synthetic controller' }],
  ['rights.management.exercise', { rightType: 'Review', subjectId: 'SYNTHETIC-1' }]
];

test('routes every exact pre-authorized action to its agent', async () => {
  for (const [actionType, payload] of actions) {
    const result = await oblivionAI.execute(actionType, payload);
    assert.equal(result.actionType, actionType);
    assert.equal(result.a2spaVerified, undefined);
  }
});

test('rejects action prefixes and unknown suffixes', async () => {
  await assert.rejects(() => oblivionAI.execute('realtime.defense', {}), { code: 'UNKNOWN_ACTION' });
  await assert.rejects(() => oblivionAI.execute('realtime.defense.breach.detect.extra', {}), { code: 'UNKNOWN_ACTION' });
});
