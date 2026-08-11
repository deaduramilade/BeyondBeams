# Development Guide

## Prerequisites

- Git
- A supported Node.js LTS release and npm
- Expo-compatible Android/iOS tooling for mobile work
- Power Platform tooling only when modifying the exported solution

## Setup

```bash
git clone https://github.com/deaduramilade/oblivionsec.git
cd oblivionsec
npm ci
cd mobile
npm ci
cd ..
```

Copy `.env.example` to an ignored local file as a reference, but note that this project does not load `.env` automatically. Export values into the process environment or use an approved external launcher. Generate development-only keys with `node src/a2spa-crypto/keygen.js`, then convert PEM line breaks to escaped `\n` for single-line environment variables.

## Run

```bash
node server.js
node src/run.js "realtime.defense.breach.detect" "{\"breachId\":\"DEV-001\"}"
cd mobile && npm start
```

The CLI and server import all agents and therefore require both owner key variables. The dashboard prompts for an API key. Mobile reads public Expo variables at bundle time.

## Workflow

Create `feature/`, `fix/`, `docs/`, `test/`, `security/`, or `chore/` branches from updated `main`. Keep commits focused, update tests and docs, and open a pull request. Never force-push `main`.

## Validation

Run `node --check` for JavaScript, parse JSON, execute relevant scripts with disposable keys, run `npm audit`, scan for secrets, and run `git diff --check`. `npm test` currently fails by design because the manifest contains a placeholder; replacing it is a priority.

## Troubleshooting

- Startup key error: export `OWNER_PRIVATE_KEY` and `OWNER_PUBLIC_KEY` with valid matching PEM values.
- `API_KEYS` error: provide a non-empty JSON object such as `{"development-value":"developer"}`.
- HTTP 401: send a configured key in `x-api-key`.
- Mobile configuration alert: set both Expo public variables before bundling.
- Signature failure: confirm matching key pair and preserved PEM line breaks.