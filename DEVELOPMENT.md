# Development Guide

## Prerequisites

- Git
- A supported Node.js LTS release and npm
- A modern browser for the responsive dashboard/PWA
- Power Platform tooling only when modifying the exported solution

## Setup

```bash
git clone https://github.com/deaduramilade/beyondbeams.git
cd beyondbeams
npm ci
```

Copy `.env.example` to an ignored local file as a reference; the project does not load it automatically. Export values through the shell or approved launcher. Generate development-only issuer/policy/receipt keys outside source control, publish only public verification keys, and escape PEM line breaks as `\n` for single-line environment variables.

## Run

```bash
npm start
node src/run.js "realtime.defense.breach.detect" "{\"breachId\":\"DEV-001\"}"
```

`npm start` serves the public dashboard on `http://127.0.0.1:3000` with ephemeral in-memory keys and ignored local state. It accepts loopback hosts only and intentionally leaves sign-in and protected workflows unavailable.

The configured integration server (`node server.js`) requires OIDC/JWKS, A2SPA-R trust, a signed active policy, ignored local replay/audit paths, and a development receipt signer. The dashboard derives its endpoint from the current origin; obtain bearer identity and external authorization through an approved development issuer.

## Workflow

Create `feature/`, `fix/`, `docs/`, `test/`, `security/`, or `chore/` branches from updated `main`. Keep commits focused, update tests and docs, and open a pull request. Never force-push `main`.

## Validation

Run `npm run check`, `npm test`, parse JSON, run `npm audit --audit-level=low`, scan for secrets, and run `git diff --check`. The automated suite uses ephemeral in-memory keys and synthetic data.

## Troubleshooting

- Startup error: validate required OIDC, A2SPA, policy, signer, digest, and absolute-directory configuration without printing values.
- HTTP 401: verify bearer issuer, audience, JWKS, expiry, tenant/workload/principal claims, and scopes.
- HTTP 403: inspect the sanitized A2SPA-R or policy reason and the corresponding audit decision.
- Policy failure: verify publisher signature, exact active digest, effective/expiry time, binding, approvals, and revocation state.
- Signature failure: confirm the correct public key, key ID, algorithm, validity, and preserved PEM line breaks.
