'use strict';

const crypto = require('crypto');
const { fail } = require('./errors');

const SERIALIZATION = 'A2SPA-R-JCS-IJSON-1';
const HEX_256 = /^[0-9a-f]{64}$/;

function canonicalize(value) {
  return Buffer.from(serialize(value), 'utf8');
}

function serialize(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    if (typeof value === 'string' && hasUnpairedSurrogate(value)) fail('INVALID_CANONICAL_VALUE', 'strings must contain valid Unicode scalar values');
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) fail('INVALID_CANONICAL_VALUE', 'numbers must be safe integers');
    return Object.is(value, -0) ? '0' : String(value);
  }
  if (Array.isArray(value)) return `[${value.map(serialize).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const keys = Object.keys(value).sort(compareUnicode);
    return `{${keys.map(key => `${serialize(key)}:${serialize(value[key])}`).join(',')}}`;
  }
  fail('INVALID_CANONICAL_VALUE', 'only I-JSON objects, arrays, strings, booleans, null, and safe integers are supported');
}

function digest(value, domain = 'object') {
  return crypto.createHash('sha256')
    .update(`A2SPA-R\0${SERIALIZATION}\0${domain}\0`, 'utf8')
    .update(canonicalize(value))
    .digest('hex');
}

function compareUnicode(left, right) {
  const a = Array.from(left, character => character.codePointAt(0));
  const b = Array.from(right, character => character.codePointAt(0));
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

function hasUnpairedSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      if (++index >= value.length || value.charCodeAt(index) < 0xdc00 || value.charCodeAt(index) > 0xdfff) return true;
    } else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}

module.exports = { HEX_256, SERIALIZATION, canonicalize, digest };