# Testing Strategy

## Current state

There is no automated test framework or CI workflow. `npm test` exits with “no test specified.” Existing `test-*.js` files are executable demonstrations that log outcomes and do not reliably fail the process on assertion failures.

## Existing scripts

| Script | Purpose | Requirement |
|---|---|---|
| `test-a2spa.js` | Sign/verify demonstration | Key files under ignored `keys/` |
| `test-realtime-defense.js` | Agent smoke test | Owner key environment variables |
| `test-orchestrator.js` | Router smoke test | Owner key environment variables |

## Required test layers

1. Unit tests for hashing, signing, verification, expiry, malformed envelopes, key mismatch, and action routing.
2. Replay tests backed by a future nonce store.
3. API integration tests for authentication, malformed JSON, schemas, status codes, CORS, size limits, and error redaction.
4. Contract tests for each action request and response.
5. Mobile/dashboard tests for configuration and error handling.
6. Security tests for abuse, rate limits, dependency advisories, and secret leakage.
7. Copilot solution validation after export changes.

## Acceptance criteria

Tests must be deterministic, isolated, use ephemeral keys and synthetic data, avoid network dependence unless explicitly integration-scoped, and return a non-zero exit code on failure. Pull requests should block on tests, lint/syntax, dependency review, secret scanning, and Markdown/link checks. Coverage thresholds should be adopted after a real runner exists; security-critical branches require direct tests regardless of aggregate coverage.