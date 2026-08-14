'use strict';

const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const buildScript = path.join(root, 'scripts', 'build-portfolio.js');
const previewScript = path.join(root, 'scripts', 'serve-portfolio.js');
const artifactsDirectory = path.join(root, 'artifacts', 'portfolio-browser');
const timeouts = Object.freeze({
  browserClose: 5000,
  browserStart: 15000,
  build: 15000,
  cdpCommand: 8000,
  cdpConnect: 8000,
  condition: 8000,
  http: 5000,
  navigation: 12000,
  processExit: 5000,
  previewStart: 8000,
  socketClose: 2000
});
const viewports = Object.freeze([
  { name: 'phone-320', width: 320, height: 720 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]);
const publicRoutes = Object.freeze(['/', '/system/', '/agents/', '/workflows/', '/assurance/']);
const absentRoutes = Object.freeze(['/api/cases', '/auth/login', '/auth/csrf', '/audit/export', '/execute', '/missing']);
const assetRoutes = Object.freeze([
  ['/assets/portfolio.css', 'text/css'],
  ['/assets/portfolio.js', 'text/javascript'],
  ['/assets/favicon.svg', 'image/svg+xml'],
  ['/assets/logo.png', 'image/png']
]);
const browserRouteAllowlist = Object.freeze([
  ...publicRoutes,
  ...assetRoutes.map(([route]) => route)
]);

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', event => this.handleMessage(event.data));
    socket.addEventListener('close', () => this.rejectPending(new Error('CDP socket closed')));
  }

  static async connect(url) {
    if (typeof WebSocket !== 'function') throw new Error('browser validation requires a Node.js release with the WebSocket API');
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`CDP socket connection timed out after ${timeouts.cdpConnect}ms`)), timeouts.cdpConnect);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP socket connection failed')); }, { once: true });
    });
    return new CdpClient(socket);
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(listener);
    return () => this.listeners.get(method)?.delete(listener);
  }

  send(method, params = {}, timeout = timeouts.cdpCommand) {
    if (this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error(`cannot send ${method}: CDP socket is not open`));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeout}ms`));
      }, timeout);
      this.pending.set(id, { method, resolve, reject, timer });
      try {
        this.socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  async close() {
    this.rejectPending(new Error('CDP client closed'));
    if (this.socket.readyState === WebSocket.CLOSED) return true;
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), timeouts.socketClose);
      this.socket.addEventListener('close', () => { clearTimeout(timer); resolve(true); }, { once: true });
      try { this.socket.close(1000, 'validation complete'); } catch { clearTimeout(timer); resolve(false); }
    });
  }

  handleMessage(data) {
    Promise.resolve(messageText(data)).then(text => {
      const message = JSON.parse(text);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method} failed: ${message.error.message}`));
        else pending.resolve(message.result || {});
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
    }).catch(error => this.rejectPending(error));
  }

  rejectPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

async function run() {
  const startedAt = new Date().toISOString();
  const report = {
    status: 'running',
    startedAt,
    timeouts,
    routes: {},
    viewports: [],
    interactions: {},
    accessibility: {},
    network: {}
  };
  const diagnostics = { consoleErrors: [], exceptions: [], loadingFailures: [], requests: [], responses: [] };
  let preview;
  let browser;
  let page;
  let failure;

  await removeDirectory(artifactsDirectory);
  fs.mkdirSync(artifactsDirectory, { recursive: true });

  try {
    report.build = buildPortfolio();
    preview = await startPreview();
    report.origin = preview.origin;
    await validateHttpSurface(preview.origin, report);

    browser = await startBrowser();
    report.browser = browser.version;
    page = await CdpClient.connect(browser.target.webSocketDebuggerUrl);
    attachDiagnostics(page, diagnostics);
    await Promise.all([
      page.send('Page.enable'),
      page.send('Runtime.enable'),
      page.send('Network.enable'),
      page.send('Log.enable'),
      page.send('Accessibility.enable')
    ]);
    await page.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });

    await validateBrowserRoutes(page, preview.origin, report);
    await validateResponsiveLayouts(page, preview.origin, report);
    report.interactions.mobileNavigation = await validateMobileNavigation(page, preview.origin);
    report.interactions.skipLink = await validateSkipLink(page, preview.origin);
    report.interactions.workflowTabs = await validateWorkflowTabs(page, preview.origin);
    report.accessibility = await validateAccessibilityTree(page);
    validateBrowserDiagnostics(preview.origin, diagnostics, report);
  } catch (error) {
    failure = error;
    if (page) await captureScreenshot(page, path.join(artifactsDirectory, 'failure.png')).catch(() => {});
  } finally {
    const teardown = {};
    if (browser) {
      try { teardown.browser = await stopBrowser(browser, page); } catch (error) { failure ||= error; teardown.browserError = error.message; }
    } else if (page) {
      teardown.pageSocketClosed = await page.close().catch(() => false);
    }
    if (preview) {
      try { teardown.preview = await stopChildProcess(preview.child, 'portfolio preview'); } catch (error) { failure ||= error; teardown.previewError = error.message; }
    }
    report.teardown = teardown;
    report.status = failure ? 'failed' : 'passed';
    report.finishedAt = new Date().toISOString();
    report.durationMs = Date.parse(report.finishedAt) - Date.parse(startedAt);
    if (failure) report.failure = { name: failure.name, message: failure.message, stack: failure.stack };
    if (preview) report.previewDiagnostics = { stdout: preview.output.stdout(), stderr: preview.output.stderr() };
    if (browser) report.browserDiagnostics = { stdout: browser.output.stdout(), stderr: browser.output.stderr() };
    fs.writeFileSync(path.join(artifactsDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (failure) {
    process.stderr.write(`Portfolio browser validation failed: ${failure.stack || failure.message}\n`);
    process.stderr.write(`Diagnostics: ${path.relative(root, path.join(artifactsDirectory, 'report.json'))}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Portfolio browser validation passed across ${viewports.length} viewports.\n`);
  process.stdout.write(`Artifacts: ${path.relative(root, artifactsDirectory)}\n`);
}

function buildPortfolio() {
  const result = spawnSync(process.execPath, [buildScript], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    timeout: timeouts.build,
    windowsHide: true
  });
  if (result.error) throw new Error(`portfolio build failed: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`portfolio build exited with ${result.status}: ${(result.stderr || result.stdout).trim()}`);
  return { stdout: result.stdout.trim() };
}

async function startPreview() {
  const child = spawn(process.execPath, [previewScript], {
    cwd: root,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  const output = captureProcessOutput(child);
  let origin;
  try {
    await waitFor('portfolio preview startup', () => {
      if (child.exitCode !== null) throw new Error(`portfolio preview exited with ${child.exitCode}: ${output.stderr()}`);
      const match = output.stdout().match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) origin = `http://127.0.0.1:${match[1]}`;
      return Boolean(origin);
    }, timeouts.previewStart);
    await waitFor('portfolio preview health check', async () => (await request(origin)).status === 200, timeouts.previewStart);
    return { child, origin, output };
  } catch (error) {
    await stopChildProcess(child, 'portfolio preview').catch(() => {});
    throw error;
  }
}

async function startBrowser() {
  const executable = findBrowserExecutable();
  const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'beyondbeams-portfolio-browser-'));
  const args = [
    '--headless=new',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-gpu',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDirectory}`,
    '--window-size=1440,900',
    'about:blank'
  ];
  const child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const output = captureProcessOutput(child);
  const activePortFile = path.join(profileDirectory, 'DevToolsActivePort');
  try {
    await waitFor('browser DevTools endpoint', () => {
      if (child.exitCode !== null) throw new Error(`browser exited with ${child.exitCode}: ${output.stderr()}`);
      return fs.existsSync(activePortFile) && fs.readFileSync(activePortFile, 'utf8').trim().length > 0;
    }, timeouts.browserStart);
    const port = Number(fs.readFileSync(activePortFile, 'utf8').split(/\r?\n/, 1)[0]);
    assert.ok(Number.isInteger(port) && port > 0, 'browser returned an invalid DevTools port');
    let version;
    let targets;
    await waitFor('browser page target', async () => {
      version = await requestJson(`http://127.0.0.1:${port}/json/version`);
      targets = await requestJson(`http://127.0.0.1:${port}/json/list`);
      return targets.some(target => target.type === 'page' && target.webSocketDebuggerUrl);
    }, timeouts.browserStart);
    return {
      child,
      executable,
      output,
      port,
      profileDirectory,
      target: targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl),
      version: {
        product: version.Browser,
        protocolVersion: version['Protocol-Version'],
        userAgent: version['User-Agent']
      }
    };
  } catch (error) {
    await stopChildProcess(child, 'browser').catch(() => {});
    await removeDirectory(profileDirectory).catch(() => {});
    throw error;
  }
}

async function validateHttpSurface(origin, report) {
  for (const route of publicRoutes) {
    const response = await request(`${origin}${route}`);
    assert.equal(response.status, 200, `${route} should return 200`);
    assert.match(response.headers['content-type'] || '', /^text\/html\b/, `${route} should return HTML`);
    assert.equal(response.headers['content-security-policy']?.includes("connect-src 'none'"), true, `${route} should deny connections`);
    report.routes[route] = { status: response.status, contentType: response.headers['content-type'] };
  }
  for (const [route, mediaType] of assetRoutes) {
    const response = await request(`${origin}${route}`);
    assert.equal(response.status, 200, `${route} should return 200`);
    assert.match(response.headers['content-type'] || '', new RegExp(`^${escapeRegex(mediaType)}\\b`), `${route} should have the expected media type`);
    report.routes[route] = { status: response.status, contentType: response.headers['content-type'] };
  }
  for (const route of absentRoutes) {
    const response = await request(`${origin}${route}`);
    assert.equal(response.status, 404, `${route} must remain absent`);
    assert.equal(response.body, 'Not Found\n', `${route} should not be masked by portfolio HTML`);
    report.routes[route] = { status: response.status, contentType: response.headers['content-type'] };
  }
  const mutation = await request(`${origin}/api/cases`, { method: 'POST' });
  assert.equal(mutation.status, 405, 'backend-style mutations must be rejected');
  assert.equal(mutation.body, 'Method Not Allowed\n');
  report.routes['POST /api/cases'] = { status: mutation.status };
}

async function validateBrowserRoutes(page, origin, report) {
  await setViewport(page, { width: 1024, height: 768 });
  for (const route of publicRoutes) {
    const navigation = await navigate(page, `${origin}${route}`);
    assert.equal(navigation.status, 200, `${route} browser navigation should return 200`);
    const state = await evaluate(page, `(() => ({
      title: document.title,
      heading: document.querySelector('h1')?.textContent.trim(),
      workflow: Boolean(document.querySelector('#workflow-stage .workflow-frame')),
      origin: location.origin,
      pathname: location.pathname
    }))()`);
    assert.match(state.title, /BeyondBeams/);
    assert.match(state.heading, /AI should not outrun/);
    assert.equal(state.workflow, true);
    assert.equal(state.origin, origin, 'all runtime resources should remain same-origin');
    report.routes[route].browser = { pathname: state.pathname, title: state.title };
  }
}

async function validateResponsiveLayouts(page, origin, report) {
  for (const viewport of viewports) {
    await setViewport(page, viewport);
    await navigate(page, origin);
    const layout = await evaluate(page, `(() => {
      const visible = element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const outOfViewport = [...document.querySelectorAll('h1, h2, h3, a, button, .demo-bar > span, .status-strip li')].filter(element => {
        const style = getComputedStyle(element);
        if (!visible(element) || style.position === 'fixed') return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
      }).slice(0, 20).map(element => ({
        tag: element.tagName,
        id: element.id,
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(element.getBoundingClientRect().left),
        right: Math.round(element.getBoundingClientRect().right)
      }));
      const overlap = (first, second) => {
        if (!first || !second || !visible(first) || !visible(second)) return false;
        const a = first.getBoundingClientRect();
        const b = second.getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      };
      return {
        viewportWidth: innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        outOfViewport,
        overlaps: {
          brandAndNavigation: overlap(document.querySelector('.brand'), document.querySelector('#site-nav')),
          brandAndToggle: overlap(document.querySelector('.brand'), document.querySelector('#nav-toggle')),
          heroHeadingAndSummary: overlap(document.querySelector('.hero h1'), document.querySelector('.hero-summary')),
          workflowHeadingAndTabs: overlap(document.querySelector('#workflows .section-heading'), document.querySelector('.view-tabs'))
        },
        menuToggleVisible: visible(document.querySelector('#nav-toggle')),
        navigationVisible: visible(document.querySelector('#site-nav')),
        mainWidth: Math.round(document.querySelector('main').getBoundingClientRect().width),
        workflowWidth: Math.round(document.querySelector('.workflow-frame').getBoundingClientRect().width)
      };
    })()`);
    assert.equal(layout.clientWidth, viewport.width, `${viewport.name} should use its requested CSS viewport width`);
    assert.ok(layout.scrollWidth <= layout.clientWidth + 1, `${viewport.name} must not have horizontal page overflow`);
    assert.deepEqual(layout.outOfViewport, [], `${viewport.name} has viewport-clipped text or controls`);
    assert.deepEqual(Object.values(layout.overlaps), [false, false, false, false], `${viewport.name} has overlapping primary content`);
    assert.equal(layout.menuToggleVisible, viewport.width <= 1080, `${viewport.name} navigation breakpoint should be consistent`);
    assert.equal(layout.navigationVisible, viewport.width > 1080, `${viewport.name} navigation visibility should be consistent`);
    const screenshot = path.join(artifactsDirectory, `${viewport.name}.png`);
    await captureScreenshot(page, screenshot);
    report.viewports.push({ ...viewport, layout, screenshot: path.relative(root, screenshot) });
  }
}

async function validateMobileNavigation(page, origin) {
  await setViewport(page, { width: 390, height: 844 });
  await navigate(page, origin);
  const before = await evaluate(page, `(() => ({ expanded: document.querySelector('#nav-toggle').getAttribute('aria-expanded'), open: document.querySelector('#site-nav').classList.contains('open') }))()`);
  assert.deepEqual(before, { expanded: 'false', open: false });
  await click(page, '#nav-toggle');
  const opened = await evaluate(page, `(() => ({ expanded: document.querySelector('#nav-toggle').getAttribute('aria-expanded'), open: document.querySelector('#site-nav').classList.contains('open'), display: getComputedStyle(document.querySelector('#site-nav')).display }))()`);
  assert.equal(opened.expanded, 'true');
  assert.equal(opened.open, true);
  assert.notEqual(opened.display, 'none');
  await click(page, '#site-nav a[href="#system"]');
  await waitForBrowser(page, 'mobile navigation anchor', `location.hash === '#system' && !document.querySelector('#site-nav').classList.contains('open')`);
  const closed = await evaluate(page, `(() => {
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const target = document.querySelector('#system').getBoundingClientRect();
    return { expanded: document.querySelector('#nav-toggle').getAttribute('aria-expanded'), open: document.querySelector('#site-nav').classList.contains('open'), headerBottom: Math.round(header.bottom), targetTop: Math.round(target.top) };
  })()`);
  assert.equal(closed.expanded, 'false');
  assert.equal(closed.open, false);
  assert.ok(closed.targetTop >= closed.headerBottom - 1, 'sticky header must not cover the anchored section');
  return { before, opened, closed };
}

async function validateSkipLink(page, origin) {
  await setViewport(page, { width: 390, height: 844 });
  await navigate(page, origin);
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  const focused = await evaluate(page, `(() => ({ tag: document.activeElement.tagName, className: document.activeElement.className, text: document.activeElement.textContent.trim() }))()`);
  assert.equal(focused.className, 'skip-link', 'first Tab should focus the skip link');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitForBrowser(page, 'skip-link focus transfer', `document.activeElement.id === 'main-content' && location.hash === '#main-content'`);
  const transferred = await evaluate(page, `(() => ({ id: document.activeElement.id, tabindex: document.activeElement.getAttribute('tabindex'), hash: location.hash, top: Math.round(document.querySelector('#main-content').getBoundingClientRect().top) }))()`);
  assert.equal(transferred.tabindex, '-1');
  return { focused, transferred };
}

async function validateWorkflowTabs(page, origin) {
  await setViewport(page, { width: 1024, height: 768 });
  await navigate(page, `${origin}/workflows/#workflow-review`);
  const direct = await workflowState(page);
  assert.equal(direct.selected, 'workflow-tab-review');
  assert.equal(direct.title, 'Review queue');
  assert.equal(direct.hash, '#workflow-review');
  await click(page, '#workflow-tab-dashboard');
  await focus(page, '#workflow-tab-dashboard');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await waitForBrowser(page, 'workflow ArrowRight selection', `document.activeElement.id === 'workflow-tab-request' && document.querySelector('#workflow-tab-request').getAttribute('aria-selected') === 'true'`);
  const arrow = await workflowState(page);
  assert.equal(arrow.title, 'Start a governed case');
  assert.equal(arrow.hash, '#workflow-request');
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
  await waitForBrowser(page, 'workflow End selection', `document.activeElement.id === 'workflow-tab-audit' && document.querySelector('#workflow-tab-audit').getAttribute('aria-selected') === 'true'`);
  const end = await workflowState(page);
  assert.equal(end.title, 'Audit & integrity');
  assert.equal(end.hash, '#workflow-audit');
  await evaluate(page, `(() => { location.hash = '#workflow-review'; })()`);
  await waitForBrowser(page, 'workflow hash restoration', `document.querySelector('#workflow-tab-review').getAttribute('aria-selected') === 'true'`);
  const restored = await workflowState(page);
  assert.equal(restored.title, 'Review queue');
  await click(page, '#workflow-tab-dashboard');
  return { direct, arrow, end, restored };
}

async function validateAccessibilityTree(page) {
  await setViewport(page, { width: 1440, height: 900 });
  const { nodes = [] } = await page.send('Accessibility.getFullAXTree');
  const meaningful = nodes.filter(node => !node.ignored);
  const roles = meaningful.map(node => node.role?.value).filter(Boolean);
  const names = meaningful.map(node => node.name?.value).filter(Boolean);
  for (const role of ['main', 'navigation', 'tab', 'tabpanel', 'table', 'columnheader', 'cell']) assert.ok(roles.includes(role), `accessibility tree should contain ${role}`);
  assert.ok(names.some(name => /AI should not outrun/.test(name)), 'accessibility tree should expose the primary heading');
  assert.ok(names.some(name => /Portfolio navigation/.test(name)), 'accessibility tree should expose the navigation label');
  return {
    meaningfulNodeCount: meaningful.length,
    roles: Object.fromEntries([...new Set(roles)].sort().map(role => [role, roles.filter(value => value === role).length])),
    landmarkNames: names.filter(name => /Portfolio navigation|AI should not outrun|Audit & integrity/.test(name))
  };
}

function attachDiagnostics(page, diagnostics) {
  page.on('Runtime.consoleAPICalled', event => {
    if (['error', 'assert'].includes(event.type)) diagnostics.consoleErrors.push(event.args.map(argument => argument.value ?? argument.description ?? argument.type).join(' '));
  });
  page.on('Runtime.exceptionThrown', event => diagnostics.exceptions.push(event.exceptionDetails?.text || 'uncaught browser exception'));
  page.on('Log.entryAdded', event => {
    if (event.entry?.level === 'error') diagnostics.consoleErrors.push(event.entry.text);
  });
  page.on('Network.loadingFailed', event => {
    if (!event.canceled) diagnostics.loadingFailures.push({ errorText: event.errorText, type: event.type, url: event.url });
  });
  page.on('Network.requestWillBeSent', event => {
    if (event.request?.url) diagnostics.requests.push({ method: event.request.method, type: event.type, url: event.request.url });
  });
  page.on('Network.responseReceived', event => {
    if (event.response?.url) diagnostics.responses.push({ status: event.response.status, type: event.type, url: event.response.url });
  });
}

function validateBrowserDiagnostics(origin, diagnostics, report) {
  assert.deepEqual(diagnostics.consoleErrors, [], 'browser console should have no errors');
  assert.deepEqual(diagnostics.exceptions, [], 'browser should have no uncaught exceptions');
  assert.deepEqual(diagnostics.loadingFailures, [], 'browser resources should load without failures');
  const unexpected = diagnostics.requests.filter(request => {
    let url;
    try { url = new URL(request.url); } catch { return true; }
    return request.method !== 'GET'
      || url.origin !== origin
      || !['http:', 'https:'].includes(url.protocol)
      || url.search !== ''
      || !browserRouteAllowlist.includes(url.pathname);
  });
  assert.deepEqual(unexpected, [], 'browser must request only allowlisted same-origin static resources');
  const responseErrors = diagnostics.responses.filter(response => response.status >= 400);
  assert.deepEqual(responseErrors, [], 'browser navigation and asset responses should succeed');
  const uniqueRequests = [...new Set(diagnostics.requests.map(request => request.url))];
  assert.ok(uniqueRequests.some(url => url.endsWith('/assets/portfolio.css')), 'browser should load the portfolio stylesheet');
  assert.ok(uniqueRequests.some(url => url.endsWith('/assets/portfolio.js')), 'browser should load the portfolio script');
  report.network = {
    requestCount: diagnostics.requests.length,
    responseCount: diagnostics.responses.length,
    uniqueRequests,
    consoleErrors: diagnostics.consoleErrors,
    exceptions: diagnostics.exceptions,
    loadingFailures: diagnostics.loadingFailures
  };
}

async function navigate(page, url) {
  const loaded = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Page.loadEventFired timed out after ${timeouts.navigation}ms for ${url}`)), timeouts.navigation);
    let removeListener;
    const listener = () => { clearTimeout(timer); removeListener(); resolve(); };
    removeListener = page.on('Page.loadEventFired', listener);
  });
  const result = await page.send('Page.navigate', { url }, timeouts.navigation);
  if (result.errorText) throw new Error(`navigation to ${url} failed: ${result.errorText}`);
  await loaded;
  await waitForBrowser(page, `page readiness for ${url}`, `document.readyState === 'complete' && document.querySelector('#workflow-stage .workflow-frame') !== null`, timeouts.navigation);
  const response = await request(url);
  return { status: response.status };
}

async function setViewport(page, viewport) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 430,
    screenWidth: viewport.width,
    screenHeight: viewport.height
  });
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`browser evaluation failed: ${result.exceptionDetails.text || 'unknown exception'}`);
  return result.result?.value;
}

async function click(page, selector) {
  const clicked = await evaluate(page, `(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.click(); return true; })()`);
  assert.equal(clicked, true, `${selector} should exist and be clickable`);
}

async function focus(page, selector) {
  const focused = await evaluate(page, `(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.focus(); return document.activeElement === element; })()`);
  assert.equal(focused, true, `${selector} should accept focus`);
}

async function workflowState(page) {
  return evaluate(page, `(() => ({
    activeElement: document.activeElement.id,
    selected: document.querySelector('[role="tab"][aria-selected="true"]')?.id,
    labelledBy: document.querySelector('#workflow-stage').getAttribute('aria-labelledby'),
    title: document.querySelector('#workflow-stage .workflow-title h3')?.textContent.trim(),
    hash: location.hash
  }))()`);
}

async function waitForBrowser(page, label, expression, timeout = timeouts.condition) {
  await waitFor(label, async () => Boolean(await evaluate(page, expression)), timeout);
}

async function captureScreenshot(page, file) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true }, timeouts.navigation);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

async function stopBrowser(browser, page) {
  let closeRequested = false;
  let pageSocketClosed = false;
  try {
    if (page) {
      await page.send('Browser.close', {}, timeouts.browserClose);
      closeRequested = true;
    }
  } catch {}
  if (page) pageSocketClosed = await page.close().catch(() => false);
  const processResult = await stopChildProcess(browser.child, 'browser', closeRequested);
  const profileRemoved = await removeDirectory(browser.profileDirectory);
  return { closeRequested, pageSocketClosed, process: processResult, profileRemoved };
}

async function stopChildProcess(child, label, waitBeforeSignal = false) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return { alreadyExited: true, exitCode: child?.exitCode ?? null, signalCode: child?.signalCode ?? null };
  if (waitBeforeSignal && await waitForProcessExit(child, timeouts.processExit)) return { graceful: true, exitCode: child.exitCode, signalCode: child.signalCode };
  child.kill('SIGTERM');
  if (await waitForProcessExit(child, timeouts.processExit)) return { terminated: true, exitCode: child.exitCode, signalCode: child.signalCode };
  killProcessTree(child.pid);
  if (await waitForProcessExit(child, timeouts.processExit)) return { forced: true, exitCode: child.exitCode, signalCode: child.signalCode };
  throw new Error(`${label} process ${child.pid} did not exit after bounded shutdown`);
}

function killProcessTree(pid) {
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8', timeout: timeouts.processExit, windowsHide: true });
    return;
  }
  try { process.kill(pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}

function waitForProcessExit(child, timeout) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    const timer = setTimeout(() => { child.removeListener('exit', onExit); resolve(false); }, timeout);
    const onExit = () => { clearTimeout(timer); resolve(true); };
    child.once('exit', onExit);
  });
}

function captureProcessOutput(child) {
  let stdout = '';
  let stderr = '';
  const append = (current, chunk) => `${current}${chunk.toString()}`.slice(-64 * 1024);
  child.stdout?.on('data', chunk => { stdout = append(stdout, chunk); });
  child.stderr?.on('data', chunk => { stderr = append(stderr, chunk); });
  return { stdout: () => stdout.trim(), stderr: () => stderr.trim() };
}

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method: options.method || 'GET', timeout: timeouts.http }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ body: Buffer.concat(chunks).toString('utf8'), headers: response.headers, status: response.statusCode }));
    });
    request.once('timeout', () => request.destroy(new Error(`HTTP request timed out after ${timeouts.http}ms: ${url}`)));
    request.once('error', reject);
    request.end(options.body);
  });
}

async function requestJson(url) {
  const response = await request(url);
  if (response.status !== 200) throw new Error(`${url} returned ${response.status}`);
  return JSON.parse(response.body);
}

async function waitFor(label, condition, timeout = timeouts.condition) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { if (await condition()) return; } catch (error) { lastError = error; }
    await delay(50);
  }
  throw new Error(`${label} timed out after ${timeout}ms${lastError ? `: ${lastError.message}` : ''}`);
}

async function removeDirectory(directory) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try { fs.rmSync(directory, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 }); return true; } catch (error) {
      if (!['EBUSY', 'ENOTEMPTY', 'EPERM'].includes(error.code) || attempt === 6) throw error;
      await delay(attempt * 150);
    }
  }
  return false;
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PORTFOLIO_BROWSER_PATH,
    process.platform === 'win32' && process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe') : null,
    process.platform === 'win32' && process.env.ProgramFiles ? path.join(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : null,
    process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : null,
    process.platform === 'win32' && process.env.ProgramFiles ? path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/microsoft-edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].filter(Boolean);
  const executable = candidates.find(candidate => fs.existsSync(candidate));
  if (!executable) throw new Error('Microsoft Edge, Google Chrome, or Chromium was not found; set PORTFOLIO_BROWSER_PATH to its executable');
  return executable;
}

function messageText(data) {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
  if (data && typeof data.text === 'function') return data.text();
  return String(data);
}

function delay(milliseconds) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

run().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});