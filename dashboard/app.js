'use strict';

const schemas = {
  'realtime.defense.breach.detect': [['breachId', 'Breach reference', 'text'], ['affectedRecords', 'Affected records', 'number'], ['dataFlow', 'Data flow', 'text']],
  'compliance.automation.dpia.generate': [['projectName', 'Project name', 'text'], ['riskLevel', 'Risk level', 'select', ['Low', 'Medium', 'High', 'Critical']]],
  'predictive.analytics.risk.model': [['dataFlow', 'Data flow', 'text'], ['riskScore', 'Risk score (optional)', 'select', ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']]],
  'regulatory.oversight.perform': [['controller', 'Controller', 'text']],
  'rights.management.exercise': [['rightType', 'Right requested', 'text'], ['subjectId', 'Synthetic subject reference', 'text']]
};
const agents = Object.freeze([
  {
    id: 'real-time-defense', code: 'RTD-01', name: 'Real-Time Defense', action: 'realtime.defense.breach.detect', signal: 'Threat containment',
    thesis: 'Turn a suspected data breach into an attributable, reviewable response record.',
    intention: 'Reduce the time between detection and governed institutional response without removing human authority.',
    vision: 'Every high-velocity defense action arrives with policy context, evidence, and a durable accountability trail.',
    ability: 'Accepts a breach reference, affected-record estimate, and data-flow description; returns a simulated breach-handled status.',
    benefit: 'Structures incident intake consistently while preserving authorization and review boundaries.',
    strength: 'Fast, narrowly scoped breach triage with an exact action contract.',
    works: ['Breach detection record', 'Timestamped response status', 'Governed case timeline'],
    uses: ['Security operations intake', 'Data exposure triage', 'Incident review preparation'],
    promptLabel: 'Describe the affected data flow', promptPlaceholder: 'Example: Citizen records moved from the intake service to an unapproved analytics store.', promptField: 'dataFlow',
    fields: [['breachId', 'Breach reference', 'text', 'SYNTHETIC-001'], ['affectedRecords', 'Estimated affected records', 'number', '0']]
  },
  {
    id: 'compliance-automation', code: 'CMP-02', name: 'Compliance Automation', action: 'compliance.automation.dpia.generate', signal: 'Impact assessment',
    thesis: 'Frame a proposed project for a consistent, human-reviewed impact assessment.',
    intention: 'Make privacy and governance analysis easier to initiate and harder to leave undocumented.',
    vision: 'Impact assessment becomes a continuous, inspectable institutional practice rather than a late-stage document.',
    ability: 'Accepts a project description and risk level; returns a simulated DPIA identifier marked review required.',
    benefit: 'Creates a repeatable starting point for specialists while making review status explicit.',
    strength: 'Consistent assessment initiation with a mandatory human-review signal.',
    works: ['Simulated DPIA record', 'Review-required classification', 'Policy-linked case history'],
    uses: ['New service assessment', 'Data-processing change review', 'Procurement governance'],
    promptLabel: 'Describe the project to assess', promptPlaceholder: 'Example: Assess the synthetic benefits eligibility matching pilot.', promptField: 'projectName',
    fields: [['riskLevel', 'Initial risk level', 'select', ['Low', 'Medium', 'High', 'Critical']]]
  },
  {
    id: 'predictive-analytics', code: 'PAN-03', name: 'Predictive Analytics', action: 'predictive.analytics.risk.model', signal: 'Risk intelligence',
    thesis: 'Surface a simulated risk signal and practical safeguards for a defined data flow.',
    intention: 'Support earlier risk conversations without presenting a model output as an institutional decision.',
    vision: 'Predictive signals remain explainable inputs to accountable, contestable human processes.',
    ability: 'Accepts a data-flow description and optional risk hypothesis; returns a simulated HIGH risk score and safeguards.',
    benefit: 'Makes risk assumptions visible and gives reviewers a concrete set of recommendations to examine.',
    strength: 'Action-oriented recommendations paired with an explicit simulated score.',
    works: ['Simulated risk score', 'Safeguard recommendations', 'Reviewable analysis record'],
    uses: ['Architecture risk discovery', 'Control-gap workshops', 'DPIA preparation'],
    promptLabel: 'Describe the data flow to model', promptPlaceholder: 'Example: Model risk in the synthetic cross-agency identity verification flow.', promptField: 'dataFlow',
    fields: [['riskScore', 'Optional starting hypothesis', 'select', ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']]]
  },
  {
    id: 'regulatory-oversight', code: 'REG-04', name: 'Regulatory Oversight', action: 'regulatory.oversight.perform', signal: 'Control inspection',
    thesis: 'Open a traceable oversight activity for a named controller or accountable body.',
    intention: 'Help oversight teams establish a clear subject and evidence trail before conclusions are reached.',
    vision: 'Regulatory scrutiny is timely, evidence-led, and independently reviewable across its full lifecycle.',
    ability: 'Accepts a controller description; returns a simulated completed-oversight status and audit identifier.',
    benefit: 'Standardizes oversight initiation and keeps activity inside the tenant-scoped audit boundary.',
    strength: 'Clear ownership focus and a concise, traceable oversight artifact.',
    works: ['Simulated audit identifier', 'Oversight status record', 'Tenant-scoped accountability trail'],
    uses: ['Controller review', 'Program assurance', 'Regulatory inquiry preparation'],
    promptLabel: 'Identify the controller or body to review', promptPlaceholder: 'Example: Review the synthetic digital permits program controller.', promptField: 'controller', fields: []
  },
  {
    id: 'rights-management', code: 'RGT-05', name: 'Rights Management', action: 'rights.management.exercise', signal: 'Rights & remedy',
    thesis: 'Route a rights request into a visible, governed case rather than an opaque automation path.',
    intention: 'Protect access to human review, objection, appeal, correction, and remedy throughout a request.',
    vision: 'People can exercise rights through processes that are understandable, attributable, and contestable.',
    ability: 'Accepts a requested right and synthetic subject reference; returns a simulated right-exercised status.',
    benefit: 'Creates a structured rights record while preserving published institutional service channels.',
    strength: 'Rights-first workflow framing with explicit remedy and human-review boundaries.',
    works: ['Rights request record', 'Request-type confirmation', 'Case path for review and remedy'],
    uses: ['Access request intake', 'Correction or objection routing', 'Appeal and remedy preparation'],
    promptLabel: 'State the right being requested', promptPlaceholder: 'Example: Request access to the synthetic records held about this subject.', promptField: 'rightType',
    fields: [['subjectId', 'Synthetic subject reference', 'text', 'SUBJECT-001']]
  }
]);
const state = { csrfToken: null, authenticated: false, cases: [] };
const main = document.querySelector('#main-content');
const connectionStatus = document.querySelector('#connection-status');
const signOut = document.querySelector('#sign-out');
const signInLink = document.querySelector('#sign-in-link');

function safe(value) { const node = document.createElement('span'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? 'Not set' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
function actionName(value) { return ({ 'realtime.defense.breach.detect': 'Breach response', 'compliance.automation.dpia.generate': 'Impact assessment', 'predictive.analytics.risk.model': 'Risk model', 'regulatory.oversight.perform': 'Oversight review', 'rights.management.exercise': 'Rights & remedy' })[value] || value; }
function isAttention(item) { return ['submitted', 'triage', 'pending_review', 'appeal', 'objection'].includes(item.state); }
function caseRows(items) { return items.length ? items.map((item, index) => `<a class="case-row" href="/cases/${encodeURIComponent(item.caseId)}"><span class="record-index">${String(index + 1).padStart(2, '0')}</span><span><h3>${safe(actionName(item.actionType))}</h3><p>${safe(item.caseId)} · Updated ${safe(formatDate(item.updatedAt))}</p></span><span class="state ${isAttention(item) ? 'attention' : ''}">${safe(item.state.replaceAll('_', ' '))}</span></a>`).join('') : '<div class="empty-state"><h2>No cases here—yet.</h2><p>Once a governed request is submitted, its status and accountability trail will appear here.</p><a class="button primary" href="/cases/new">Start a case</a></div>'; }
function heading(kicker, title, note) { return `<header class="page-heading"><div><p class="eyebrow">${kicker}</p><h1 class="page-title">${title}</h1></div><p class="heading-note">${note}</p></header>`; }

async function request(url, options = {}) { const response = await fetch(url, { credentials: 'same-origin', ...options }); let body = null; try { body = await response.json(); } catch {} if (!response.ok) { const error = new Error(body?.error?.message || 'The request could not be completed.'); error.status = response.status; error.code = body?.error?.code; throw error; } return body; }
async function establishSession() { try { state.csrfToken = (await request('/auth/csrf')).csrfToken; state.authenticated = true; signOut.hidden = false; signInLink.hidden = true; } catch { state.csrfToken = null; state.authenticated = false; signOut.hidden = true; signInLink.hidden = false; } }
async function loadCases(query = '') { const body = await request(`/api/cases${query}`); state.cases = body.cases; return body.cases; }
function unauthorized(container, message = 'Sign in with an authorized institutional account to use this workspace.') { container.innerHTML = `<div class="empty-state"><p class="eyebrow">Session required</p><h2>This area is protected.</h2><p>${message}</p><a class="button primary" href="/sign-in">Go to sign in</a></div>`; }

function agentCard(agent, index) {
  return `<a class="agent-card agent-${index + 1}" href="/agents/${agent.id}"><span class="agent-code">${agent.code}</span><span class="agent-orbit" aria-hidden="true"><i></i></span><div><p class="agent-signal">${agent.signal}</p><h2>${agent.name}</h2><p>${agent.thesis}</p></div><span class="agent-link">Open intelligence <span aria-hidden="true">↗</span></span></a>`;
}

function renderAgents() {
  document.title = 'Intelligence agents — Oblivion-AI';
  main.innerHTML = `<div class="page agents-page"><header class="agents-header"><div><p class="eyebrow">Intelligence constellation / 05 active prototypes</p><h1 class="page-title">Purpose-built<br>intelligence.</h1></div><p class="lede">Five specialized agents turn defined institutional needs into governed, reviewable casework. Explore what each prototype does, where it helps, and how its exact action contract works.</p></header><section class="agent-grid" aria-label="Available agents">${agents.map(agentCard).join('')}</section><aside class="agents-boundary"><span>Operating boundary</span><p>These agents return simulated recommendations or statuses. They do not make institutional decisions, and every interaction requires authenticated policy authorization and human-governed case handling.</p></aside></div>`;
}

function agentFieldMarkup(field) {
  const [name, label, type, options] = field;
  if (type === 'select') return `<label>${label}<select name="${name}" ${name === 'riskLevel' ? 'required' : ''}>${options.map(option => `<option value="${option}">${option || 'No hypothesis'}</option>`).join('')}</select></label>`;
  return `<label>${label}<input name="${name}" type="${type}" placeholder="${safe(options)}" ${type === 'number' ? 'min="0" max="1000000000"' : 'maxlength="128"'} required></label>`;
}

function renderAgent(agent) {
  document.title = `${agent.name} — Oblivion-AI`;
  const agentIndex = agents.indexOf(agent) + 1;
  main.innerHTML = `<div class="agent-profile agent-profile-${agentIndex}"><section class="agent-hero"><div class="agent-hero-copy"><a class="back-link" href="/agents">← All agents</a><p class="eyebrow">${agent.code} / ${agent.signal}</p><h1>${agent.name}</h1><p class="agent-thesis">${agent.thesis}</p><div class="agent-status"><span><i aria-hidden="true"></i> Prototype available</span><span>Action / ${agent.action}</span></div></div><div class="agent-core" aria-hidden="true"><span class="core-ring ring-one"></span><span class="core-ring ring-two"></span><span class="core-node">${String(agentIndex).padStart(2, '0')}</span></div></section><section class="agent-manifest"><article><span>01 / Intention</span><h2>${agent.intention}</h2></article><article><span>02 / Vision</span><h2>${agent.vision}</h2></article></section><section class="agent-capabilities"><div class="capability-lead"><p class="eyebrow">Intelligence profile</p><h2>Focused by design.<br>Governed by default.</h2><p>${agent.ability}</p></div><div class="capability-facts"><article><span>Benefit</span><p>${agent.benefit}</p></article><article><span>Core strength</span><p>${agent.strength}</p></article></div></section><section class="agent-evidence"><div><p class="eyebrow">What it produces</p><ol>${agent.works.map((item, index) => `<li><span>0${index + 1}</span>${item}</li>`).join('')}</ol></div><div><p class="eyebrow">Use cases</p><ol>${agent.uses.map((item, index) => `<li><span>0${index + 1}</span>${item}</li>`).join('')}</ol></div></section><section id="agent-workspace" class="agent-workspace"><div class="workspace-intro"><p class="eyebrow">Engage ${agent.code}</p><h2>Start with an intention.</h2><p>Describe the task, complete the exact action inputs, and submit it as a governed case. The server validates policy and authorization before this agent can be reached.</p><div class="flow-line"><span>Prompt</span><i></i><span>Authorize</span><i></i><span>Review</span></div></div><form id="agent-form" class="prompt-console"><div class="console-bar"><span><i aria-hidden="true"></i> Secure interaction channel</span><span>${agent.code}</span></div><label class="prompt-label">${agent.promptLabel}<textarea id="agent-prompt" name="${agent.promptField}" rows="5" maxlength="${agent.promptField === 'rightType' ? 128 : 256}" placeholder="${agent.promptPlaceholder}" required></textarea></label><div class="agent-fields">${agent.fields.map(agentFieldMarkup).join('')}</div><p class="console-note">Your prompt is structured as <code>${agent.promptField}</code>. Use synthetic data only. This prototype does not provide a conversational model or production service.</p><button class="button signal" type="submit">Create governed case</button><p id="agent-form-error" class="field-error" aria-live="polite"></p></form></section></div>`;
  const form = document.querySelector('#agent-form');
  if (!state.authenticated) {
    form.querySelectorAll('textarea, input, select, button').forEach(item => item.disabled = true);
    document.querySelector('#agent-form-error').innerHTML = 'An authorized institutional session is required. <a href="/sign-in">Sign in to engage this agent.</a>';
  }
  form.addEventListener('submit', event => submitAgentCase(event, agent));
}

async function submitAgentCase(event, agent) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector('#agent-form-error');
  error.textContent = '';
  const payload = Object.fromEntries([...new FormData(form).entries()].filter(([, value]) => value !== ''));
  for (const field of agent.fields) if (field[2] === 'number') payload[field[0]] = Number(payload[field[0]]);
  try {
    const body = await request('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken }, body: JSON.stringify({ actionType: agent.action, payload, inputMethod: 'guided' }) });
    window.location.assign(`/cases/${encodeURIComponent(body.case.caseId)}`);
  } catch (requestError) { error.textContent = requestError.status === 401 ? 'Your session expired. Sign in again.' : requestError.message; }
}

function renderLanding() {
  document.title = 'Oblivion-AI — Accountable automation';
  main.innerHTML = `<div class="page"><section class="hero"><div class="hero-copy"><p class="eyebrow">Governed AI infrastructure / Development prototype</p><h1 class="display">Powerful AI.<br><em>Answerable</em> by design.</h1><p class="lede">Oblivion-AI gives public institutions a governed path from request to review—binding identity, policy, human oversight, and evidence into every case.</p><div class="hero-actions"><a class="button primary" href="/agents">Explore the agents</a><a class="button" href="/sign-in">Access the workspace</a></div></div><aside class="hero-side"><span class="hero-number">05</span><p><strong>specialized domain agents.</strong><br>Each produces simulated recommendations only after authorization. Institutional decisions remain human responsibilities.</p></aside></section><section id="principles" class="statement-grid" aria-label="Product principles"><article class="statement"><span class="statement-index">01 / AUTHORIZE</span><h2>Policy before execution.</h2><p>Exact actions pass signed authorization, tenant, purpose, freshness, and active-policy checks before an agent is reached.</p></article><article class="statement"><span class="statement-index">02 / REVIEW</span><h2>Humans hold the line.</h2><p>Explicit case states, role checks, and separation of duties preserve accountable institutional review.</p></article><article class="statement"><span class="statement-index">03 / PROVE</span><h2>Receipts, not promises.</h2><p>Linked receipts and a hash-chained audit ledger create inspectable evidence of the prototype's activity.</p></article></section></div>`;
}

function renderSignIn() {
  document.title = 'Sign in — Oblivion-AI';
  main.innerHTML = `<div class="page"><section class="auth-layout"><div class="auth-intro"><p class="eyebrow">Institutional access</p><h1>Enter the<br><em>governed</em><br>workspace.</h1><p class="lede">One identity. Scoped permissions. Every consequential action attributable.</p></div><div class="auth-card"><p class="eyebrow">Sign in / Request access</p><h2>Continue through your institution</h2><p>Oblivion-AI does not store passwords or offer public self-registration. Your approved identity provider authenticates you and your institution assigns access.</p><a class="button signal" href="/auth/login?returnTo=%2Fdashboard">Continue to institutional sign in</a><div class="access-details"><details><summary>Need an account?</summary><p>Ask your institution's service administrator to provision access through its identity provider. Self-sign-up is intentionally unavailable.</p></details><details><summary>Provider not configured?</summary><p>This repository is a development prototype. A real OIDC identity and durable session provider must be selected before sign-in can operate outside injected tests.</p></details><details><summary>Using assistive technology?</summary><p>Use your institution's published accessibility or non-digital service channel. This interface has not yet received independent accessibility assessment.</p></details></div></div></section></div>`;
}

async function renderDashboard() {
  document.title = 'Dashboard — Oblivion-AI';
  main.innerHTML = `<div class="page">${heading('Tenant workspace', 'Cases, at a glance.', 'Your institution-scoped requests and their current governed state.')}<div id="dashboard-content" aria-live="polite"><div class="empty-state"><p>Loading protected workspace…</p></div></div></div>`;
  const container = document.querySelector('#dashboard-content'); if (!state.authenticated) return unauthorized(container);
  try { const cases = await loadCases(); const active = cases.filter(item => !['closed', 'cancelled'].includes(item.state)); const attention = cases.filter(isAttention); const overdue = cases.filter(item => item.deadlineAt && Date.parse(item.deadlineAt) < Date.now() && !['closed', 'cancelled'].includes(item.state)); container.innerHTML = `<div class="notice"><strong>Synthetic staging.</strong> Do not enter personal, classified, or operational data. Recommendations are simulated.</div><section class="metric-grid" aria-label="Case summary"><div class="metric"><span>All cases</span><strong>${cases.length}</strong></div><div class="metric"><span>Active</span><strong>${active.length}</strong></div><div class="metric"><span>Needs attention</span><strong>${attention.length}</strong></div><div class="metric"><span>Overdue</span><strong>${overdue.length}</strong></div></section><div class="content-grid"><section class="panel"><div class="panel-heading"><h2>Recent cases</h2><a class="text-link" href="/cases/new">New case</a></div><div class="case-list">${caseRows(cases.slice(0, 6))}</div></section><aside class="panel"><h2>Governed path</h2><ol class="process-list"><li>Submit a validated case payload.</li><li>Policy and authorization are evaluated server-side.</li><li>Authorized staff review under explicit role boundaries.</li><li>Reasoned records preserve decision context.</li><li>Appeal and remedy remain institutional workflows.</li></ol></aside></div>`; connectionStatus.textContent = `${cases.length} cases loaded.`; } catch (error) { error.status === 401 ? unauthorized(container) : container.innerHTML = errorState(error); }
}

function newCaseMarkup() { return `<div class="page">${heading('Requester workflow / 01', 'Start a governed case.', 'Choose a supported workflow and provide synthetic development data only.')}<div class="notice"><strong>Data boundary:</strong> no personal, classified, operational, or production data. Provider-backed evidence upload is not available.</div><div class="form-shell"><form id="case-form" novalidate><div class="form-field"><label for="action-type">Workflow</label><select id="action-type" required><option value="realtime.defense.breach.detect">Breach response</option><option value="compliance.automation.dpia.generate">Impact assessment</option><option value="predictive.analytics.risk.model">Risk model</option><option value="regulatory.oversight.perform">Oversight review</option><option value="rights.management.exercise">Rights and remedy</option></select></div><fieldset><legend>Input method</legend><label><input type="radio" name="input-method" value="guided" checked> Guided form</label><label><input type="radio" name="input-method" value="json"> JSON input</label></fieldset><div id="guided-fields" class="guided-fields"></div><div id="json-field" class="form-field" hidden><label for="json-input">JSON payload</label><textarea id="json-input" rows="8" disabled aria-describedby="json-help json-error"></textarea><p id="json-help" class="field-help">Payload only. JSON cannot provide identity, permissions, policy approval, or authorization.</p><p id="json-error" class="field-error" aria-live="polite"></p></div><button class="button primary" type="submit">Submit for governed review</button><p id="form-error" class="field-error" aria-live="polite"></p></form><aside class="panel"><p class="eyebrow">What happens next</p><h2>Control stays visible.</h2><ol class="process-list"><li>Input is schema validated.</li><li>Identity, scope, and active policy are checked.</li><li>A server-side issuer obtains authorization.</li><li>The submitted case enters the tenant queue.</li></ol></aside></div></div>`; }
function renderFields() { const action = document.querySelector('#action-type'); const target = document.querySelector('#guided-fields'); target.replaceChildren(); for (const [name, label, type, values] of schemas[action.value]) { const wrapper = document.createElement('div'); wrapper.className = 'form-field'; const fieldLabel = document.createElement('label'); fieldLabel.htmlFor = `field-${name}`; fieldLabel.textContent = label; const input = type === 'select' ? document.createElement('select') : document.createElement('input'); input.id = `field-${name}`; input.name = name; input.required = !values || values[0] !== ''; if (type === 'number') input.type = 'number'; if (values) for (const value of values) { const option = document.createElement('option'); option.value = value; option.textContent = value || 'Not specified'; input.append(option); } wrapper.append(fieldLabel, input); target.append(wrapper); } }
function setMethod(value) { const input = document.querySelector('#json-input'); const field = document.querySelector('#json-field'); const useJson = value === 'json'; input.disabled = !useJson; field.hidden = !useJson; if (useJson) input.focus(); }
function readPayload() { const input = document.querySelector('#json-input'); if (input.disabled) return Object.fromEntries([...document.querySelectorAll('#guided-fields input, #guided-fields select')].filter(item => item.value !== '').map(item => [item.name, item.type === 'number' ? Number(item.value) : item.value])); try { const value = JSON.parse(input.value); document.querySelector('#json-error').textContent = ''; return value; } catch { document.querySelector('#json-error').textContent = 'Enter valid JSON payload data.'; return null; } }
function renderNewCase() { document.title = 'New case — Oblivion-AI'; main.innerHTML = newCaseMarkup(); const form = document.querySelector('#case-form'); renderFields(); if (!state.authenticated) { form.querySelectorAll('input, select, textarea, button').forEach(item => item.disabled = true); document.querySelector('#form-error').innerHTML = 'An authorized session is required. <a href="/sign-in">Sign in to continue.</a>'; } document.querySelector('#action-type').addEventListener('change', renderFields); document.querySelectorAll('input[name="input-method"]').forEach(input => input.addEventListener('change', event => setMethod(event.target.value))); form.addEventListener('submit', submitCase); }
async function submitCase(event) { event.preventDefault(); const error = document.querySelector('#form-error'); error.textContent = ''; const payload = readPayload(); if (!payload || typeof payload !== 'object' || Array.isArray(payload)) { error.textContent = 'Complete the payload before submitting.'; return; } try { const body = await request('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken }, body: JSON.stringify({ actionType: document.querySelector('#action-type').value, payload, inputMethod: document.querySelector('#json-input').disabled ? 'guided' : 'json' }) }); window.location.assign(`/cases/${encodeURIComponent(body.case.caseId)}`); } catch (requestError) { error.textContent = requestError.status === 401 ? 'Your session expired. Sign in again.' : requestError.message; } }

async function renderReview() {
  document.title = 'Review queue — Oblivion-AI'; main.innerHTML = `<div class="page">${heading('Reviewer workspace / 02', 'Review queue.', 'Filter tenant-scoped cases. Available records depend on your verified scopes and role claims.')}<form id="filters" class="filter-bar"><input id="query" aria-label="Search cases" placeholder="Search case ID, action, or state"><select id="review-state" aria-label="Filter by state"><option value="">All states</option><option>submitted</option><option>triage</option><option>assigned</option><option>recommendation</option><option>pending_review</option><option>appeal</option><option>remedy</option></select><select id="priority" aria-label="Filter by priority"><option value="">All priorities</option><option>low</option><option>normal</option><option>high</option><option>urgent</option></select><button class="button primary" type="submit">Apply</button></form><div id="review-list" class="case-list" aria-live="polite"><div class="empty-state"><p>Loading queue…</p></div></div></div>`;
  const list = document.querySelector('#review-list'); if (!state.authenticated) return unauthorized(list, 'Review access requires a session with case:read; transitions additionally require case:review and an eligible role.');
  async function update() { const params = new URLSearchParams(); for (const [id, key] of [['query','query'],['review-state','state'],['priority','priority']]) { const value = document.querySelector(`#${id}`).value; if (value) params.set(key, value); } try { list.innerHTML = caseRows(await loadCases(params.size ? `?${params}` : '')); } catch (error) { list.innerHTML = errorState(error); } }
  document.querySelector('#filters').addEventListener('submit', event => { event.preventDefault(); update(); }); update();
}

async function renderCaseDetail(caseId) {
  document.title = 'Case detail — Oblivion-AI'; main.innerHTML = `<div class="page"><div id="case-detail" aria-live="polite"><div class="empty-state"><p>Loading protected case…</p></div></div></div>`; const container = document.querySelector('#case-detail'); if (!state.authenticated) return unauthorized(container);
  try { const item = (await request(`/api/cases/${encodeURIComponent(caseId)}`)).case; container.innerHTML = `${heading('Case record / 03', actionName(item.actionType), `Tenant-scoped case ${safe(item.caseId)}`)}<div class="detail-grid"><div><section class="panel"><div class="panel-heading"><h2>Case facts</h2><span class="state ${isAttention(item) ? 'attention' : ''}">${safe(item.state.replaceAll('_',' '))}</span></div><table class="data-table"><tr><th>Case ID</th><td>${safe(item.caseId)}</td></tr><tr><th>Requester</th><td>${safe(item.requesterId)}</td></tr><tr><th>Assigned to</th><td>${safe(item.assignedTo || 'Unassigned')}</td></tr><tr><th>Priority</th><td>${safe(item.priority)}</td></tr><tr><th>Deadline</th><td>${safe(formatDate(item.deadlineAt))}</td></tr><tr><th>Input</th><td>${safe(item.inputMethod)}</td></tr></table><h2>Submitted payload</h2><pre>${safe(JSON.stringify(item.payload, null, 2))}</pre></section><section class="panel"><h2>Registered evidence</h2>${item.evidence.length ? `<table class="data-table">${item.evidence.map(e => `<tr><th>${safe(e.scanStatus)}</th><td>${safe(e.name)} · ${safe(e.mediaType)} · ${e.size} bytes</td></tr>`).join('')}</table>` : '<p class="heading-note">No evidence metadata registered. Binary upload and scanning providers are not implemented.</p>'}</section></div><aside class="panel"><h2>Accountability trail</h2><ol class="timeline">${item.timeline.slice().reverse().map(event => `<li><strong>${safe((event.state || event.event || 'event').replaceAll('_',' '))}</strong><span>${safe(formatDate(event.at))}<br>${safe(event.actorId || '')}</span></li>`).join('')}</ol></aside></div>`; } catch (error) { if (error.status === 401) unauthorized(container); else container.innerHTML = errorState(error); }
}

async function renderAudit() {
  document.title = 'Audit administration — Oblivion-AI'; main.innerHTML = `<div class="page">${heading('Administration / 04', 'Audit & integrity.', 'Protected operational evidence. Access attempts are themselves audited.')}<div id="audit-content" class="content-grid" aria-live="polite"><div class="empty-state"><p>Checking authorization…</p></div></div></div>`; const container = document.querySelector('#audit-content'); if (!state.authenticated) return unauthorized(container, 'This area requires audit:verify or audit:export scope assigned by your institution.');
  try { const integrity = await request('/audit/integrity'); container.innerHTML = `<section class="audit-card"><p class="eyebrow">Ledger verification</p><span class="integrity-value ${integrity.valid ? 'good' : ''}">${integrity.valid ? 'Intact' : 'Invalid'}</span><p>Local hash-chain verification completed. This is development evidence, not production assurance or approval.</p><pre>${safe(JSON.stringify(integrity, null, 2))}</pre></section><aside class="panel"><h2>Audit actions</h2><p class="heading-note">Exports are restricted to the authenticated tenant and require a separate scope.</p><button id="export-audit" class="button primary" type="button">Export tenant records</button><p id="audit-error" class="field-error" aria-live="polite"></p></aside>`; document.querySelector('#export-audit').addEventListener('click', exportAudit); } catch (error) { container.innerHTML = error.status === 403 ? '<div class="empty-state"><h2>Insufficient audit scope.</h2><p>Your session is valid, but this administrative evidence is not available to your assigned permissions.</p><a class="button" href="/dashboard">Return to dashboard</a></div>' : errorState(error); }
}
async function exportAudit() { const error = document.querySelector('#audit-error'); try { const records = await request('/audit/export'); const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'oblivion-audit-development.json'; link.click(); URL.revokeObjectURL(link.href); } catch (requestError) { error.textContent = requestError.message; } }
function errorState(error) { return `<div class="empty-state"><p class="eyebrow">Unable to load</p><h2>${error.status === 403 ? 'Access is not assigned.' : 'Something interrupted the request.'}</h2><p>${safe(error.message)}</p><button class="button" type="button" onclick="window.location.reload()">Try again</button></div>`; }

async function route() { const path = window.location.pathname; document.querySelectorAll('.site-nav a').forEach(link => link.toggleAttribute('aria-current', link.getAttribute('href') === path || (link.getAttribute('href') === '/agents' && path.startsWith('/agents/')))); if (path === '/') renderLanding(); else if (path === '/sign-in') renderSignIn(); else if (path === '/agents') renderAgents(); else if (path === '/dashboard') await renderDashboard(); else if (path === '/cases/new') renderNewCase(); else if (path === '/review') await renderReview(); else if (path === '/admin/audit') await renderAudit(); else { const agentMatch = path.match(/^\/agents\/([^/]+)$/); const caseMatch = path.match(/^\/cases\/([^/]+)$/); if (agentMatch && agents.some(agent => agent.id === agentMatch[1])) renderAgent(agents.find(agent => agent.id === agentMatch[1])); else if (caseMatch) await renderCaseDetail(decodeURIComponent(caseMatch[1])); else { document.title = 'Page not found — Oblivion-AI'; main.innerHTML = `<div class="page"><div class="empty-state"><p class="eyebrow">404</p><h1 class="page-title">Page not found.</h1><a class="button primary" href="/">Return home</a></div></div>`; } } }
document.querySelector('#nav-toggle').addEventListener('click', event => { const nav = document.querySelector('#site-nav'); const open = nav.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
signOut.addEventListener('click', async () => { if (!state.csrfToken) return; try { await request('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': state.csrfToken } }); state.csrfToken = null; window.location.assign('/'); } catch { connectionStatus.textContent = 'Sign-out could not be completed.'; } });
window.addEventListener('offline', () => { connectionStatus.textContent = 'Offline. Protected case operations are unavailable.'; }); window.addEventListener('online', () => { connectionStatus.textContent = 'Connection restored.'; });
(async () => { await establishSession(); await route(); if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js')); })();