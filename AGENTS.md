# Instructions for Coding Agents

This file governs automated assistants working in this repository. Active human instructions take precedence, but security and repository-integrity requirements remain mandatory.

## Before changing code

1. Read `README.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`, and relevant source files.
2. Inspect `git status`, the active branch, and recent commits; never overwrite unrelated work.
3. Confirm behavior from code. Documentation claims are not evidence that a control exists.
4. Work on a branch. Never commit new work directly to `main`.

## Invariants

- Domain actions are intended to pass an A2SPA signature check.
- Credentials and private keys are runtime inputs and must never enter Git.
- `Oblivion_1_0_0_2/` is an exported solution artifact; avoid mechanical rewrites.
- Lockfiles remain synchronized with manifests.
- Changes reach `main` only through reviewed pull requests.

## Engineering rules

- Follow existing CommonJS and browser conventions.
- Prefer shared security primitives over duplicated cryptography.
- Validate external input; never add permissive authentication defaults.
- Never log credentials, keys, sensitive payloads, or personal data.
- Never claim compliance, production readiness, or assurance without evidence.
- Record consequential design choices under `docs/adr/`.

## Validation

Run syntax checks, JSON parsing, relevant tests, a secret scan, and `git diff --check`. `npm test` uses Node's built-in deterministic test runner; report its actual result. Update documentation and `PROJECT_STATUS.md` when behavior or risk changes.

## Security boundaries

Never commit `.env`, PEM material, API keys, tokens, connection strings, personal paths, or production identifiers. Browser configuration is public. Do not weaken A2SPA, authentication, listener exposure, or CORS without threat review and an ADR.