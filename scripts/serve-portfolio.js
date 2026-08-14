'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = process.env.PORTFOLIO_OUTPUT_DIRECTORY
  ? path.resolve(process.env.PORTFOLIO_OUTPUT_DIRECTORY)
  : path.resolve(__dirname, '..', 'dist', 'portfolio');
const host = '127.0.0.1';
const port = parsePort(process.env.PORT || '4173');
const mediaTypes = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
});

if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('portfolio artifact is missing; run npm run build:portfolio first');

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('Method Not Allowed\n');
    return;
  }
  const url = new URL(request.url, `http://${host}:${port}`);
  const file = resolveFile(url.pathname);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('Not Found\n');
    return;
  }

  response.writeHead(200, {
    'Content-Type': mediaTypes[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self' data:; script-src 'self'; style-src 'self'; font-src 'none'; object-src 'none'; worker-src 'none'"
  });
  if (request.method === 'HEAD') return response.end();
  fs.createReadStream(file).pipe(response);
});

server.listen(port, host, () => process.stdout.write(`Portfolio preview: http://${host}:${server.address().port}\n`));

function resolveFile(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.includes('\\') || decoded.includes('\0')) return null;
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\//, '');
  const candidate = path.resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return path.join(candidate, 'index.html');
  return candidate;
}

function parsePort(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 65535) throw new Error('PORT must be an integer from 0 to 65535');
  return parsed;
}