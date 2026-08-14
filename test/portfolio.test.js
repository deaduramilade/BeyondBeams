'use strict';

const assert = require('node:assert/strict');
const { execFileSync, spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const portfolio = path.join(root, 'portfolio');
const html = fs.readFileSync(path.join(portfolio, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(portfolio, 'assets', 'portfolio.js'), 'utf8');
const css = fs.readFileSync(path.join(portfolio, 'assets', 'portfolio.css'), 'utf8');
const browserValidator = fs.readFileSync(path.join(root, 'scripts', 'validate-portfolio-browser.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

test('portfolio clearly identifies its read-only non-production boundary', () => {
  assert.match(html, /Read-only portfolio demonstration/);
  assert.match(html, /No live service · No sign-in · No data submission/);
  assert.match(html, /cannot authenticate users, execute agents, create cases, or access an API/);
  assert.match(html, /Pre-production prototype/);
  assert.match(html, /NOT_READY/);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /type="(?:email|password|file|text|number)"/i);
});

test('portfolio JavaScript is local-only and cannot call backend or browser transport APIs', () => {
  for (const transport of [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /EventSource/, /serviceWorker/, /localStorage/, /sessionStorage/]) assert.doesNotMatch(script, transport);
  assert.doesNotMatch(script, /['"`]\/(?:api|auth|audit|execute)(?:\/|['"`])/);
  assert.doesNotMatch(script, /location\.(?:assign|replace)|window\.open/);
  assert.match(script, /renderWorkflow\(viewFromHash\(\) \|\| 'dashboard'\)/);
  assert.match(script, /history\.replaceState/);
});

test('portfolio loads no third-party runtime assets', () => {
  assert.doesNotMatch(css, /@import|https?:\/\//);
  assert.doesNotMatch(script, /https?:\/\//);
  const externalLinks = [...html.matchAll(/(?:href|src)="(https?:\/\/[^\"]+)"/g)].map(match => match[1]);
  assert.deepEqual(externalLinks, [
    'https://github.com/deaduramilade/BeyondBeams',
    'https://github.com/deaduramilade/BeyondBeams'
  ]);
});

test('portfolio exposes accessible responsive presentation controls', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main-content" tabindex="-1">/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-controls="workflow-stage"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(script, /<table>/);
  assert.match(script, /scope="col"/);
  assert.match(script, /event\.key === 'ArrowRight'/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width: 780px\)/);
  assert.match(css, /scroll-margin-top/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /safe-area-inset-left/);
});

test('Vercel configuration deploys only the generated static artifact without catch-all rewrites', () => {
  assert.equal(vercel.framework, null, 'null selects Vercel Other and prevents Express framework detection');
  assert.equal(vercel.buildCommand, 'npm run build:portfolio');
  assert.equal(vercel.outputDirectory, 'dist/portfolio');
  assert.equal(vercel.cleanUrls, false);
  assert.equal(vercel.trailingSlash, false);
  assert.equal(Object.hasOwn(vercel, 'rewrites'), false);
  assert.equal(Object.hasOwn(vercel, 'redirects'), false);
  assert.equal(Object.hasOwn(vercel, 'functions'), false);
  assert.ok(Array.isArray(vercel.headers));
  assert.match(JSON.stringify(vercel.headers), /Content-Security-Policy/);
});

test('browser validation has bounded diagnostics and cleans up only its owned processes', () => {
  assert.equal(packageJson.scripts['validate:portfolio:browser'], 'node scripts/validate-portfolio-browser.js');
  assert.match(packageJson.scripts.verify, /npm run validate:portfolio:browser/);
  assert.match(packageJson.scripts.check, /node --check scripts\/validate-portfolio-browser\.js/);
  for (const deadline of ['browserClose', 'browserStart', 'cdpCommand', 'cdpConnect', 'http', 'navigation', 'processExit', 'previewStart', 'socketClose']) {
    assert.match(browserValidator, new RegExp(`${deadline}: \\d+`), `${deadline} should be bounded`);
  }
  assert.match(browserValidator, /Browser\.close/);
  assert.match(browserValidator, /taskkill\.exe', \['\/PID', String\(pid\), '\/T', '\/F'\]/);
  assert.doesNotMatch(browserValidator, /taskkill\.exe'.*'\/IM'/);
  assert.match(browserValidator, /failure\.png/);
  assert.match(browserValidator, /report\.json/);
  assert.match(browserValidator, /beyondbeams-portfolio-browser-/);
  assert.match(browserValidator, /removeDirectory\(browser\.profileDirectory\)/);
});

test('portfolio build contains only explicit presentation routes and no backend namespace', t => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-portfolio-'));
  t.after(() => fs.rmSync(output, { recursive: true, force: true }));
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-portfolio.js')], {
    cwd: root,
    env: { ...process.env, PORTFOLIO_OUTPUT_DIRECTORY: output }
  });

  assert.deepEqual(listFiles(output), [
    'agents/index.html',
    'assets/favicon.svg',
    'assets/logo.png',
    'assets/portfolio.css',
    'assets/portfolio.js',
    'assurance/index.html',
    'index.html',
    'system/index.html',
    'workflows/index.html'
  ]);
});

test('portfolio build refuses to erase an unowned output directory', t => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'unowned-portfolio-output-'));
  const marker = path.join(output, 'keep.txt');
  fs.writeFileSync(marker, 'must remain\n', 'utf8');
  t.after(() => fs.rmSync(output, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-portfolio.js')], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PORTFOLIO_OUTPUT_DIRECTORY: output }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing to replace an unowned portfolio output directory/);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'must remain\n');
});

test('portfolio preview serves known static files and returns 404 for protected namespaces', async t => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-portfolio-preview-'));
  t.after(() => fs.rmSync(output, { recursive: true, force: true }));
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-portfolio.js')], {
    cwd: root,
    env: { ...process.env, PORTFOLIO_OUTPUT_DIRECTORY: output }
  });

  const preview = spawn(process.execPath, [path.join(root, 'scripts', 'serve-portfolio.js')], {
    cwd: root,
    env: { ...process.env, PORTFOLIO_OUTPUT_DIRECTORY: output, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    if (preview.exitCode !== null || preview.signalCode !== null) return;
    preview.kill('SIGTERM');
    if (await waitForExit(preview, 2000)) return;
    if (process.platform === 'win32') execFileSync('taskkill.exe', ['/PID', String(preview.pid), '/T', '/F'], { stdio: 'ignore' });
    else preview.kill('SIGKILL');
    assert.equal(await waitForExit(preview, 2000), true, 'portfolio preview should exit during test cleanup');
  });
  const address = await new Promise((resolve, reject) => {
    let stdout = '';
    const timer = setTimeout(() => reject(new Error('portfolio preview did not start')), 5000);
    preview.stdout.on('data', chunk => {
      stdout += chunk.toString();
      const match = stdout.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    preview.stderr.on('data', chunk => { if (chunk.toString()) reject(new Error(chunk.toString())); });
    preview.once('error', reject);
    preview.once('exit', code => { if (code !== 0) reject(new Error(`portfolio preview exited with ${code}`)); });
  });

  for (const route of ['/', '/system/', '/assets/portfolio.js']) {
    const response = await fetch(`${address}${route}`);
    assert.equal(response.status, 200, `${route} should be public`);
  }
  for (const route of ['/api/cases', '/auth/csrf', '/audit/export', '/execute', '/missing']) {
    const response = await fetch(`${address}${route}`);
    assert.equal(response.status, 404, `${route} must remain absent`);
    assert.equal(await response.text(), 'Not Found\n');
  }
  const mutation = await request(address, '/api/cases', 'POST');
  assert.equal(mutation.status, 405);
  assert.equal(mutation.body, 'Method Not Allowed\n');
});

function request(origin, route, method) {
  return new Promise((resolve, reject) => {
    const request = http.request(`${origin}${route}`, { method }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    request.on('error', reject);
    request.end();
  });
}

function listFiles(directory, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) files.push(...listFiles(directory, name));
    else files.push(name);
  }
  return files.sort();
}

function waitForExit(child, timeout) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    const timer = setTimeout(() => { child.removeListener('exit', onExit); resolve(false); }, timeout);
    const onExit = () => { clearTimeout(timer); resolve(true); };
    child.once('exit', onExit);
  });
}
