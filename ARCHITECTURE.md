# Architecture

## Overview

BeyondBeams is a single-process Node.js authorization/execution prototype with a browser/PWA client and Copilot Studio export. It is not a production reference architecture.

| Component | Responsibility | Trust |
|---|---|---|
| Dashboard/PWA | Localized accessible development input, connectivity/manual-service boundary, and receipt display | Untrusted client |
| Express API | OIDC identity, A2SPA-R verification, policy decision, validation, receipt, audit, and HTTP translation | Security boundary |
| `BeyondBeams` | Prefix-based dispatch | Internal router |
| Policy registry | Verify and evaluate signed institution/jurisdiction packs | Security boundary |
| Replay/audit/case stores | Atomically consume nonces, preserve hash-chained events, and retain tenant-scoped case timelines | Local development persistence |
| Managed signer adapter | Sign receipts without exposing provider implementation | Highest sensitivity |
| Provider contracts and synthetic platform | Exercise integration lifecycle and failure semantics without real providers | Test-only; never a production fallback |
| Domain agents | Simulate recommendations after authorization; never make institutional decisions | Privileged process |
| Copilot export | Declarative assets, not wired to runtime | Source artifact |

## Request flow

1. Browser navigation retrieves public PWA assets; it does not pass API credentials.
2. An authenticated client posts an exact action, validated payload, and externally issued A2SPA-R envelope with an OIDC bearer token.
3. Express validates identity/scope, envelope signature and binding, active signed policy, and atomic nonce consumption.
4. A permitted decision is audited before execution; the agent returns a simulated result.
5. The executor signs a linked A2SPA-R receipt and appends its digest to the audit ledger.

For ordinary browser users, Express exposes a provider-neutral Authorization Code + PKCE login/callback boundary with one-time state/nonce, opaque `HttpOnly` sessions, rotation, exact-origin CSRF enforcement, logout and local revocation. The browser retrieves a session-bound CSRF token and never receives or enters an A2SPA-R envelope. Case submission accepts a validated action payload; the server evaluates policy and obtains the envelope through a separate authorization-issuer adapter. Guided and explicitly selected JSON payload input share the same validator. Reviewer transitions require verified role claims, tenant scope, and separation-of-duties checks. Tests inject the synthetic identity provider; no real identity, token exchange or durable distributed session adapter is selected.

## A2SPA and A2SPA-R boundary

The API verifies externally signed A2SPA-R/1 envelopes using canonical I-JSON, trusted issuer keys, identity/workload/tenant/audience binding, payload/context/policy digests, freshness, revocation metadata, and durable local nonce consumption. It returns signed linked receipts through a managed-signer interface. Selective disclosure and a production KMS/HSM adapter remain unimplemented.

## State and integrations

Local file replay, audit, case, and reference queue adapters exist for development. Provider-neutral contracts and in-memory synthetic implementations cover identity/session, managed signing, transaction/outbox, queue/worker, immutable-record metadata, malware rejection, notification receipts, document structure, policy lifecycle, telemetry, clock, backup/restore, and migration semantics. They are not wired as runtime fallbacks and provide no production custody, durability, scanning, delivery, conformance, or operational evidence. There is no selected production database, replicated queue, immutable object store, cache, backup service, or active runtime integration with the Copilot export. See `PERSISTENCE.md` and ADR-0009.

## Known risks and target direction

Remaining gates include production persistence and key providers, transactional/outbox design, immutable retention, restore/load evidence, approved regions and objectives, centralized telemetry/alerts/on-call, selective disclosure, policy publication service, institution-specific deadlines/notices/notifications/manual-service integration, and independent accessibility/jurisdictional/security validation.
