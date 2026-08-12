'use strict';

const { fail } = require('./errors');

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,255}$/;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function exactObject(value, fields, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    fail('MALFORMED', `${name} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) {
    fail('MALFORMED', `${name} fields do not match the protocol schema`);
  }
}

function identifier(value, name) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) fail('MALFORMED', `${name} is invalid`);
  return value;
}

function timestamp(value, name) {
  if (typeof value !== 'string' || !TIMESTAMP_PATTERN.test(value) || new Date(value).toISOString() !== value) {
    fail('MALFORMED', `${name} must be a canonical UTC timestamp`);
  }
  return Date.parse(value);
}

function stringArray(value, name, maximum = 64) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum ||
      value.some(item => typeof item !== 'string' || !ID_PATTERN.test(item)) || new Set(value).size !== value.length) {
    fail('MALFORMED', `${name} must contain unique identifiers`);
  }
  return value;
}

function base64url(value, name, bytes) {
  const pattern = bytes === 32 ? NONCE_PATTERN : /^[A-Za-z0-9_-]+$/;
  if (typeof value !== 'string' || !pattern.test(value) || Buffer.from(value, 'base64url').length !== bytes) {
    fail('MALFORMED', `${name} is invalid`);
  }
  return value;
}

module.exports = { base64url, exactObject, identifier, stringArray, timestamp };