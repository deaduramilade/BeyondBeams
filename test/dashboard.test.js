'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const dashboard = path.join(__dirname, '..', 'dashboard');
const html = fs.readFileSync(path.join(dashboard, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dashboard, 'style.css'), 'utf8');
const script = fs.readFileSync(path.join(dashboard, 'app.js'), 'utf8');

test('dashboard exposes semantic accessibility and service-inclusion controls', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main-content"/);
  assert.match(html, /<label for="identity-token"/);
  assert.match(html, /<label for="authorization-envelope"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Review, Appeal &amp; Manual Service/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test('dashboard localizes content, reports connectivity, and does not persist credentials', () => {
  assert.match(script, /const messages =/);
  assert.match(script, /navigator\.languages/);
  assert.match(script, /window\.addEventListener\('offline'/);
  assert.match(script, /tokenInput\.value = ''/);
  assert.match(script, /aria-invalid/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|console\.(log|error)|window\.prompt/);
});