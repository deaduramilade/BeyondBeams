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
  assert.match(html, /id="sign-out" class="text-button" type="button" hidden/);
  assert.match(html, /human review, appeal, remedy, complaint, accessibility/);
  assert.match(script, /name="input-method" value="guided" checked/);
  assert.match(script, /id="json-input" rows="8" disabled/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test('dashboard uses session APIs, reports connectivity, and does not persist credentials', () => {
  assert.match(script, /credentials: 'same-origin'/);
  assert.match(script, /request\('\/auth\/csrf'\)/);
  assert.match(script, /request\('\/auth\/logout'/);
  assert.match(script, /JSON\.parse\(input\.value\)/);
  assert.match(script, /window\.addEventListener\('offline'/);
  assert.doesNotMatch(html, /identity-token|authorization-envelope/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|console\.(log|error)|window\.prompt/);
});

test('browser shell defines the complete governed page structure', () => {
  for (const route of ['/', '/sign-in', '/agents', '/dashboard', '/cases/new', '/review', '/admin/audit']) assert.match(script, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(script, /\/cases\\\/\(\[\^\/\]\+\)/);
  assert.match(script, /does not store passwords or offer public self-registration/);
  assert.match(script, /Audit & integrity/);
  assert.match(script, /Review queue/);
});

test('agent directory exposes all implemented agents and governed prompt interaction', () => {
  for (const name of ['Real-Time Defense', 'Compliance Automation', 'Predictive Analytics', 'Regulatory Oversight', 'Rights Management']) assert.match(script, new RegExp(name));
  for (const id of ['real-time-defense', 'compliance-automation', 'predictive-analytics', 'regulatory-oversight', 'rights-management']) assert.match(script, new RegExp(id));
  assert.match(script, /function renderAgents\(\)/);
  assert.match(script, /function renderAgent\(agent\)/);
  assert.match(script, /function submitAgentCase\(event, agent\)/);
  assert.match(script, /This prototype does not provide a conversational model or production service/);
  assert.match(script, /JSON\.stringify\(\{ actionType: agent\.action, payload, inputMethod: 'guided' \}\)/);
  assert.match(css, /\.agent-workspace/);
  assert.match(css, /\.prompt-console/);
});