'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');

const patterns = [
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /AIza[0-9A-Za-z_-]{35}/
];
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const findings = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) continue;
  const lines = buffer.toString('utf8').split(/\r?\n/);
  lines.forEach((line, index) => { if (patterns.some(pattern => pattern.test(line))) findings.push(`${file}:${index + 1}`); });
}
if (findings.length) {
  process.stderr.write(`Potential credential material found at:\n${findings.join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write(`Scanned ${files.length} tracked files; no configured credential patterns found.\n`);