# Repository Readiness Checklist

**Reviewed:** 2026-08-13  
**Scope:** Behavior that can be implemented and verified without selecting or operating production infrastructure  
**Status meaning:** `Complete` means repository evidence exists. It does not establish provider conformance, production operation, compliance, or institutional approval.

| Repository-owned capability | Status | Executable evidence |
|---|---|---|
| Provider-neutral contracts and deterministic synthetic providers | Complete | `src/integrations/contracts.js`, `src/integrations/synthetic-platform.js`, `test/integration-contracts.test.js` |
| Case state, tenant, actor, purpose, policy, role, separation-of-duties and authorization validation | Complete | `src/cases/store.js`, `src/policy/policy-pack.js`, `server.js`, case/policy/server tests |
| A2SPA-R canonicalization, digest, envelope verification, replay consumption and linked receipts | Complete | `src/a2spa-r/`, `test/a2spa-r.test.js`, `test/server.test.js` |
| Policy schema, signatures, publication, activation, revocation and rollback | Complete | `src/policy/policy-pack.js`, synthetic policy provider, policy and contract tests |
| Persistence/outbox, queue, idempotency, leases, retry, dead letter, migration, backup and restore semantics | Complete | persistence and queue providers, `src/persistence/work-queue.js`, integration and operations tests |
| Immutable record metadata, retention, deletion, legal hold, scanner rejection, notifications and receipts | Complete | synthetic record/scanner/notification providers and contract tests |
| Document generation boundary and structural accessibility validation | Complete | synthetic document provider, dashboard accessibility checks, contract/dashboard tests |
| Telemetry sensitive-field rejection, metric boundaries, clock drift and alert evaluation | Complete | `src/operations/metrics.js`, synthetic telemetry provider, operations/contract tests |
| HTTP route contracts and strict action/payload input validation | Complete | `server.js`, `src/actions.js`, `API.md`, actions/server tests |
| Browser forms, guided/JSON validation, error/offline states, session integration and accessibility semantics | Complete for repository reference UI | `dashboard/`, dashboard/server tests; independent device and assistive-technology assessment remains external |
| Authorization Code + PKCE callback, one-time state/nonce, claim-to-principal boundary and session creation | Complete at provider-neutral HTTP boundary | `/auth/login`, `/auth/callback`, identity contract, synthetic lifecycle and HTTP negative tests |
| Cookie-session CSRF, exact-origin enforcement, rotation, logout and local revocation | Complete at provider-neutral HTTP boundary | `/auth/csrf`, `/auth/session/refresh`, `/auth/logout`, all cookie-authenticated mutation middleware and tests |
| Fail-closed required configuration and unavailable dependency behavior | Complete for repository runtime | `loadConfig`, readiness/admission behavior and server/security tests |
| Unit, integration, contract, regression, security-negative and property-style tests | Complete for implemented repository behavior | deterministic Node test suite, including generated canonicalization permutation invariants |
| API, configuration, architecture, threat, risk, assurance, roadmap and operational documentation | Complete for current repository state | root documentation, `docs/adr/`, this checklist and production gap audit |
| Syntax, tests, dependency audit, secret scan, JSON validation and diff hygiene | Automated | `npm run verify`, `.github/workflows/ci.yml` |

## Boundaries That Cannot Be Closed Here

Repository completion does not choose an identity provider, KMS/HSM, database, queue, immutable store, scanner, notification service, document renderer, telemetry platform, region, retention schedule, or support channel. It cannot supply credentials, prove deployed durability or availability, run a real provider handshake, approve legal authority, accept risk, or issue go-live authorization.

Any real adapter must pass the same contracts plus staging interoperability, outage, retry, rotation, revocation, restore, migration, load and failure-injection acceptance. Synthetic providers are test-only and are never runtime fallbacks.