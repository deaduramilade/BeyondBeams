'use strict';

class A2SPARError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'A2SPARError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new A2SPARError(code, message);
}

module.exports = { A2SPARError, fail };