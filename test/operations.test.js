'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { FileWorkQueue } = require('../src/persistence/work-queue');
const { Metrics } = require('../src/operations/metrics');

test('durably enqueues idempotent work, leases, retries, and dead-letters', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-queue-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let now = 1000;
  const queue = new FileWorkQueue({ directory, now: () => now, maxAttempts: 2, leaseMs: 100 });
  const input = { tenant: 'tenant-a', type: 'audit-export', idempotencyKey: 'request-1', payloadDigest: 'a'.repeat(64), reference: 'object-1' };
  const first = queue.enqueue(input);
  assert.equal(queue.enqueue(input).duplicate, true);
  assert.equal(queue.lease('worker-a').id, first.id);
  queue.fail(first.id, 'TEMPORARY_FAILURE', 50);
  assert.equal(queue.lease('worker-a'), null);
  now += 50;
  assert.equal(queue.lease('worker-b').attempts, 2);
  assert.equal(queue.fail(first.id, 'PERMANENT_FAILURE').state, 'dead-letter');
  assert.deepEqual(queue.health(), { available: true, pending: 0, deadLetter: 1 });
  assert.equal(new FileWorkQueue({ directory }).health().deadLetter, 1);
});

test('exports bounded metrics without sensitive labels', () => {
  const metrics = new Metrics();
  metrics.increment('beyondbeams_requests_total', { route: 'execute', status: '200' });
  metrics.set('beyondbeams_dependency_ready', { dependency: 'policy' }, 1);
  assert.match(metrics.render(), /beyondbeams_requests_total/);
  assert.throws(() => metrics.increment('bad-name', { actor: 'subject with spaces' }));
});

test('rejects malformed queue items before persistence', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-queue-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const queue = new FileWorkQueue({ directory });
  assert.throws(() => queue.enqueue({ tenant: '../tenant', type: 'work', idempotencyKey: 'key', payloadDigest: 'invalid', reference: 'ref' }));
  assert.equal(queue.health().pending, 0);
});
