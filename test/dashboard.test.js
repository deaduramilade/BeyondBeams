'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const dashboard = path.join(__dirname, '..', 'dashboard');
const html = fs.readFileSync(path.join(dashboard, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dashboard, 'style.css'), 'utf8');
const script = fs.readFileSync(path.join(dashboard, 'app.js'), 'utf8');
const wordmark = fs.readFileSync(path.join(dashboard, 'logo.svg'), 'utf8');
const favicon = fs.readFileSync(path.join(dashboard, 'favicon.svg'), 'utf8');

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
  for (const route of ['/', '/sign-in', '/agents', '/dashboard', '/cases/new', '/review', '/admin/audit', '/legal/privacy', '/legal/cookies', '/legal/terms']) assert.match(script, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(script, /\/cases\\\/\(\[\^\/\]\+\)/);
  assert.match(script, /does not store passwords or offer public self-registration/);
  assert.match(script, /Audit & integrity/);
  assert.match(script, /Review queue/);
});

test('public shell publishes legal notices and complete footer navigation', () => {
  for (const route of ['/legal/privacy', '/legal/cookies', '/legal/terms']) assert.match(html, new RegExp(`href="${route.replaceAll('/', '\\/')}"`));
  assert.match(html, /aria-label="Footer navigation"/);
  assert.match(script, /function renderLegal\(kind\)/);
  assert.match(script, /Public pages do not set analytics, advertising, preference, or social-media cookies/);
  assert.match(script, /No company legal name, registered address, operating jurisdiction/);
  assert.match(css, /fonts\.googleapis\.com.*Michroma/);
  assert.match(css, /family=Inter/);
});

test('brand uses the BeyondBeams logo and favicon in the header and footer', () => {
  assert.equal((html.match(/src="\/favicon\.svg"/g) || []).length, 2);
  assert.equal((html.match(/src="\/logo\.svg"/g) || []).length, 2);
  assert.match(html, /aria-label="BeyondBeams home"/);
  assert.match(html, /class="brand-wordmark" src="\/logo\.svg" alt="BeyondBeams"/);
  assert.match(css, /\.brand-mark/);
  assert.match(css, /\.brand-wordmark/);
  assert.doesNotMatch(html, /class="brand-(?:orbit|core|ai)"/);
});

test('landing page uses a mature governed-control narrative without a competing wordmark overlay', () => {
  assert.match(script, /class="landing-hero"/);
  assert.match(script, /Governance sequence/);
  assert.match(script, /AI should not outrun institutional responsibility/);
  assert.doesNotMatch(script, /class="hero-wordmark"/);
  assert.doesNotMatch(css, /\.landing-hero[^}]*beyondbeams-banner\.svg/);
  assert.match(wordmark, /mask id="stencil"/);
  assert.match(wordmark, /BEYONDBEAMS/);
  assert.match(favicon, /segmented techno-stencil/);
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
