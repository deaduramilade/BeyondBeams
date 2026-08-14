'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createLocalApp, resolveLocalHost, resolvePort } = require('../src/local-server');

test('local server starts ready without external credentials and remains unauthenticated', async t => {
  const runtimeDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-local-'));
  t.after(() => fs.rmSync(runtimeDirectory, { recursive: true, force: true }));
  const app = createLocalApp({ runtimeDirectory, logger: { info() {}, error() {} } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  assert.equal((await fetch(baseUrl)).status, 200);
  assert.deepEqual(await (await fetch(`${baseUrl}/health`)).json(), { status: 'ok' });
  assert.deepEqual(await (await fetch(`${baseUrl}/ready`)).json(), { status: 'ready' });
  assert.equal((await fetch(`${baseUrl}/api/cases`)).status, 401);
  assert.equal(findFiles(runtimeDirectory).some(file => /\.(?:pem|key)$/i.test(file)), false);
});

test('local launcher accepts only loopback hosts and valid ports', () => {
  assert.equal(resolveLocalHost(), '127.0.0.1');
  assert.equal(resolveLocalHost('localhost'), 'localhost');
  assert.throws(() => resolveLocalHost('0.0.0.0'), /loopback/);
  assert.equal(resolvePort(), 3000);
  assert.equal(resolvePort('3100'), 3100);
  assert.throws(() => resolvePort('0'), /between 1 and 65535/);
});

function findFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? findFiles(target) : [target];
  });
}
