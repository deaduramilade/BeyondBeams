'use strict';

const workflowViews = Object.freeze({
  dashboard: {
    label: 'Portfolio view / Requester workspace',
    title: 'Case overview',
    summary: 'An illustrative tenant workspace showing how governed work could be summarized after authenticated API access.',
    content: `<div class="metric-grid"><article class="metric-card"><span>Open cases</span><strong>06</strong><small>Illustrative only</small></article><article class="metric-card"><span>Awaiting review</span><strong>03</strong><small>No live queue</small></article><article class="metric-card"><span>Decision records</span><strong>12</strong><small>Sample count</small></article></div><div class="workflow-table" tabindex="0" role="region" aria-label="Illustrative case overview"><table><colgroup><col><col><col><col></colgroup><thead><tr><th scope="col">Case</th><th scope="col">Workflow</th><th scope="col">State</th><th scope="col">Priority</th></tr></thead><tbody><tr><td class="case-code">SAMPLE-0042</td><td>Impact assessment</td><td><span class="status-pill">Review</span></td><td>High</td></tr><tr><td class="case-code">SAMPLE-0038</td><td>Rights request</td><td><span class="status-pill">Triage</span></td><td>Standard</td></tr><tr><td class="case-code">SAMPLE-0031</td><td>Breach response</td><td><span class="status-pill">Decision</span></td><td>Critical</td></tr></tbody></table></div>`
  },
  request: {
    label: 'Portfolio view / Requester workflow',
    title: 'Start a governed case',
    summary: 'The live development shell uses validated guided or JSON input. This portfolio rendering is locked and accepts no data.',
    content: `<div class="notice-box">Read-only artifact — controls below are visual examples and cannot receive, retain, or submit information.</div><div class="readonly-form"><section class="form-preview" aria-labelledby="form-preview-title"><h4 id="form-preview-title" class="visually-hidden">Disabled example case form</h4><div class="field-preview"><span>Workflow</span><div class="fake-control">Impact assessment</div></div><div class="field-preview"><span>Project description</span><div class="fake-control tall">Example synthetic project description</div></div><div class="field-preview"><span>Initial risk level</span><div class="fake-control">High</div></div><button class="locked-action" type="button" disabled>Submission unavailable in portfolio mode</button></section><aside class="next-panel"><h4>Governance sequence</h4><ol><li>Validate structured input</li><li>Verify identity and tenant</li><li>Evaluate active policy</li><li>Obtain action authorization</li><li>Enter human review queue</li></ol></aside></div>`
  },
  review: {
    label: 'Portfolio view / Reviewer workspace',
    title: 'Review queue',
    summary: 'A static illustration of separation-of-duties case handling. There are no assignments, transitions, or institutional decisions here.',
    content: `<div class="notice-box">Sample records are invented presentation content, not API responses or real case information.</div><div class="queue-board"><section class="queue-column"><p><span>Triage</span><span>02</span></p><article class="queue-item"><span>SAMPLE-0038</span><strong>Rights and remedy intake</strong><small>Standard · unassigned</small></article><article class="queue-item"><span>SAMPLE-0040</span><strong>Oversight review</strong><small>High · sample reviewer</small></article></section><section class="queue-column"><p><span>In review</span><span>02</span></p><article class="queue-item"><span>SAMPLE-0042</span><strong>Impact assessment</strong><small>High · review due</small></article><article class="queue-item"><span>SAMPLE-0036</span><strong>Risk model safeguards</strong><small>Standard · sample reviewer</small></article></section><section class="queue-column"><p><span>Decision</span><span>01</span></p><article class="queue-item"><span>SAMPLE-0031</span><strong>Breach response record</strong><small>Critical · reason required</small></article></section></div>`
  },
  audit: {
    label: 'Portfolio view / Administrative evidence',
    title: 'Audit & integrity',
    summary: 'The development API protects tenant exports and chain verification with dedicated scopes. This screen exposes neither operation.',
    content: `<div class="audit-layout"><section class="audit-panel"><h4>Illustrative linked records</h4><div class="hash-chain"><div class="hash-row"><span>01</span><code>7f4c…9a21 · authorization digest</code></div><div class="hash-row"><span>02</span><code>0db8…c443 · policy decision digest</code></div><div class="hash-row"><span>03</span><code>e29a…71bf · receipt digest</code></div><div class="hash-row"><span>04</span><code>936d…2c18 · audit chain head</code></div></div></section><aside class="audit-panel"><h4>Integrity boundary</h4><div class="integrity-mark"><span>Static illustration</span><strong>Not verified</strong><p>No ledger was loaded, no endpoint was contacted, and no export was generated.</p></div><button class="locked-action" type="button" disabled>Audit export unavailable</button></aside></div>`
  }
});

const workflowStage = document.querySelector('#workflow-stage');
const viewButtons = [...document.querySelectorAll('[data-view]')];
const navToggle = document.querySelector('#nav-toggle');
const siteNav = document.querySelector('#site-nav');
const workflowViewNames = new Set(Object.keys(workflowViews));

function viewFromHash() {
  const match = location.hash.match(/^#workflow-(dashboard|request|review|audit)$/);
  return match && workflowViewNames.has(match[1]) ? match[1] : null;
}

function sidebar(active) {
  const labels = [['dashboard', 'Overview'], ['request', 'New case'], ['review', 'Review queue'], ['audit', 'Audit & integrity']];
  return `<aside class="workflow-sidebar"><div class="mini-brand"><img src="/assets/favicon.svg" alt="" width="30" height="30">BEYONDBEAMS</div><div class="sidebar-links" aria-label="Illustrative application navigation">${labels.map(([id, label]) => `<span class="${id === active ? 'active' : ''}">${label}</span>`).join('')}</div><p class="sidebar-boundary">Protected application view<br>Represented as static portfolio content</p></aside>`;
}

function renderWorkflow(name, options = {}) {
  const view = workflowViews[name] || workflowViews.dashboard;
  workflowStage.innerHTML = `<article class="workflow-frame">${sidebar(name)}<div class="workflow-content"><div class="workflow-toolbar"><p>${view.label}</p><span class="static-badge">Read-only · Sample data</span></div><header class="workflow-title"><h3>${view.title}</h3><p>${view.summary}</p></header>${view.content}</div></article>`;
  viewButtons.forEach(button => {
    const selected = button.dataset.view === name;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  workflowStage.setAttribute('aria-labelledby', `workflow-tab-${name}`);
  if (options.updateHash) history.replaceState(null, '', `${location.pathname}${location.search}#workflow-${name}`);
}

viewButtons.forEach(button => button.addEventListener('click', () => renderWorkflow(button.dataset.view, { updateHash: true })));
viewButtons.forEach(button => button.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const current = viewButtons.indexOf(event.currentTarget);
  const target = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? viewButtons.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + viewButtons.length) % viewButtons.length;
  renderWorkflow(viewButtons[target].dataset.view, { updateHash: true });
  viewButtons[target].focus();
}));

navToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

siteNav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('hashchange', () => {
  const name = viewFromHash();
  if (name) renderWorkflow(name);
});

renderWorkflow(viewFromHash() || 'dashboard');