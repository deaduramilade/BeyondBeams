'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'portfolio');
const generatedOutputRoot = path.join(root, 'dist');
const output = process.env.PORTFOLIO_OUTPUT_DIRECTORY
  ? path.resolve(process.env.PORTFOLIO_OUTPUT_DIRECTORY)
  : path.join(root, 'dist', 'portfolio');
const assets = path.join(output, 'assets');
const portfolioAssets = Object.freeze(['portfolio.css', 'portfolio.js']);

assertOwnedOutput(output);
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(assets, { recursive: true });

fs.copyFileSync(path.join(source, 'index.html'), path.join(output, 'index.html'));

for (const file of portfolioAssets) {
  fs.copyFileSync(path.join(source, 'assets', file), path.join(assets, file));
}

for (const file of ['favicon.svg', 'logo.png']) {
  fs.copyFileSync(path.join(root, 'dashboard', file), path.join(assets, file));
}

const staticRoutes = [
  'system',
  'agents',
  'workflows',
  'assurance'
];

for (const route of staticRoutes) {
  const directory = path.join(output, route);
  fs.mkdirSync(directory, { recursive: true });
  fs.copyFileSync(path.join(source, 'index.html'), path.join(directory, 'index.html'));
}

process.stdout.write(`Built read-only portfolio artifact at ${path.relative(root, output)}\n`);

function assertOwnedOutput(directory) {
  const temporaryRoot = path.resolve(os.tmpdir());
  const ownedTemporaryDirectory = containsPath(temporaryRoot, directory)
    && path.basename(directory).startsWith('beyondbeams-portfolio-');
  if (!containsPath(generatedOutputRoot, directory) && !ownedTemporaryDirectory) {
    throw new Error('refusing to replace an unowned portfolio output directory; use dist/ or a BeyondBeams portfolio test directory');
  }
}

function containsPath(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}