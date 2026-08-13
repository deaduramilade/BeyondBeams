# HTTP API

## Base and authentication

The server defaults to `http://127.0.0.1:3000`. Dashboard assets, `/health`, and `/ready` are public. `/execute` and audit endpoints require an OIDC bearer token with issuer, audience, expiry, tenant, workload, principal type, and scopes validated through JWKS. TLS must terminate at trusted ingress before non-local use.

## `POST /execute`

Request:

```json
{"actionType":"realtime.defense.breach.detect","payload":{"breachId":"EXAMPLE-001","affectedRecords":10,"dataFlow":"example"},"authorization":{"protocol":"A2SPA-R/1","...":"externally signed envelope"}}
```

Supported exact action names are `realtime.defense.breach.detect`, `compliance.automation.dpia.generate`, `predictive.analytics.risk.model`, `regulatory.oversight.perform`, and `rights.management.exercise`. Unknown suffixes are rejected.

Success envelope:

```json
{"success":true,"requestId":"opaque-id","result":{"status":"breach_handled","actionType":"realtime.defense.breach.detect"},"receipt":{"protocol":"A2SPA-R-RECEIPT/1","...":"signed receipt"}}
```

| Status | Meaning |
|---:|---|
| 200 | Agent returned a result |
| 400 | Invalid JSON, action, or payload schema |
| 401 | Credential missing, unknown, or expired |
| 403 | Identity, A2SPA-R authorization, or active policy denies the action |
| 409 | Authorization nonce was already consumed |
| 413 | JSON body exceeds the configured limit |
| 429 | Principal rate limit exceeded |
| 500 | Redacted execution failure |

Errors contain `{ "success": false, "error": { "code": "...", "message": "..." } }`. Internal exception details are not returned.

## Case workflow API

The dashboard uses opaque same-origin sessions supplied by a configured identity-provider adapter. `GET /auth/login` begins Authorization Code + PKCE with one-time state and nonce; `GET /auth/callback` consumes the callback, validates the provider result, and creates an `HttpOnly`, `SameSite=Lax` session cookie. `GET /auth/csrf` issues a session-bound synchronizer token. `POST /auth/session/refresh` rotates the session and invalidates its predecessor. `POST /auth/logout` revokes the local session and clears the cookie. Authentication responses are non-cacheable.

Every cookie-authenticated mutation requires an exact same-origin `Origin` and `X-CSRF-Token`. Missing or invalid origin/token values fail with 403. Bearer-authenticated machine API calls do not require CSRF. These routes are provider-neutral runtime boundaries; no production identity or durable session provider is selected. The legacy `OIDC_LOGIN_URL` redirect remains a broker compatibility path and does not by itself enable callback/session routes.

`POST /api/cases` requires `case:create` and accepts `actionType`, a validated `payload`, and `inputMethod` (`guided` or explicitly selected `json`). JSON is payload input only; the server performs identity, scope, policy, authorization issuance, case-state, and audit checks.

`GET /api/cases` requires `case:read`, returns only the caller tenant's records, and accepts exact `state`, `assignedTo`, `requesterId`, `priority`, `overdue`, `query`, and `order` filters. `GET /api/cases/:caseId` returns tenant-scoped case detail. `POST /api/cases/:caseId/transition` requires `case:review`; transitions are explicit and reject self-review and assignment conflicts. Decision, notice, correction, objection, appeal, remedy, and override transitions require a structured `record` with an uppercase `reasonCode` and explanation; override records also require `expiresAt`.

Additional authenticated operations are `POST /api/cases/:caseId/assign`, `/schedule`, `/escalate`, `/notes`, and `/evidence`. They support reasoned assignments, future deadlines and priorities, escalation, role-controlled notes, and evidence metadata with a SHA-256 digest and scan status. Evidence registration does not upload binaries: immutable storage, malware scanning, records disposition, notifications, and provider delivery receipts remain production integration boundaries.

No public APIs instantiate synthetic providers. Tests inject them into the provider-neutral authentication routes; they must not be used as runtime integrations or fallbacks.

## Payload fields

- Breach: `breachId`, `affectedRecords`, `dataFlow`
- DPIA: `projectName`, `riskLevel`
- Risk model: `dataFlow`, optional `riskScore` (output remains hardcoded `HIGH`)
- Oversight: `controller`
- Rights: `rightType`, `subjectId`

Runtime validation enforces required fields, primitive types, enumerations, maximum lengths, and rejects unknown fields. The JSON body limit defaults to 32 KB.

## Browser pages

The public landing page is `GET /`; `GET /sign-in` explains provider-backed access without implementing local password registration. `GET /agents` presents the five implemented domain-agent prototypes, while `GET /agents/:agentId` presents each agent's evidence-based profile and a schema-guided prompt interaction. Agent interaction creates a governed case through `POST /api/cases`; it is not a public chat endpoint and does not bypass session, CSRF, scope, policy, authorization issuance, or human-review controls. The browser shell also serves `/dashboard`, `/cases/new`, `/cases/:caseId`, `/review`, and `/admin/audit`. Protected page data remains behind the authenticated APIs—the HTML shell itself is public so ordinary navigation, loading/error states, and PWA installation work. Static assets, the manifest, and service worker are also deliberately outside API authentication.

## Audit and operations endpoints

`GET /audit/integrity` requires `audit:verify`; `GET /audit/export` requires `audit:export` and returns only the caller tenant's records. Access is audited. `/health` reports process liveness. `/ready` requires valid local audit integrity, active policy status, and receipt-signer availability; it is not production approval. `/metrics` requires the separate `x-metrics-token` credential and otherwise returns 404.