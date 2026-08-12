# Testing Strategy

## Current state

The repository uses Node's built-in `node:test` runner and a GitHub Actions workflow. `npm test` runs deterministic tests under `test/*.test.js`; legacy `test-*.js` files remain demonstrations and are not discovered by the test command.

## Existing scripts

| Script | Purpose | Requirement |
|---|---|---|
| `test-a2spa.js` | Sign/verify demonstration | Key files under ignored `keys/` |
| `test-realtime-defense.js` | Agent smoke test | Owner key environment variables |
| `test-orchestrator.js` | Router smoke test | Owner key environment variables |

## Required test layers

1. Unit tests for hashing, signing, verification, expiry, malformed envelopes, key mismatch, policy packs, and action routing.
2. Replay, audit, policy-decision, queue-idempotency, lease/retry, and metrics tests.
3. API integration tests for authentication, malformed JSON, schemas, status codes, CORS, size limits, and error redaction.
4. Contract tests for each action request and response.
5. PWA/dashboard regression tests for accessibility semantics, localization, connectivity/error handling, installability, and credential non-persistence; independent browser/device/assistive-technology testing remains required.
6. Security tests for abuse, rate limits, dependency advisories, and secret leakage.
7. Copilot solution validation after export changes.
8. Independent WCAG/assistive-technology, jurisdictional, provider-contract, timed-restore, load, alert-delivery, and incident/shutdown testing before live use.

## Acceptance criteria

Tests must be deterministic, isolated, use ephemeral keys and synthetic data, avoid external network dependence, and return a non-zero exit code on failure. CI blocks on tests, syntax, dependency audit, JSON parsing, and a tracked-file credential scan. Security-critical branches require direct tests regardless of aggregate coverage.