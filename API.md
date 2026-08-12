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

## Payload fields

- Breach: `breachId`, `affectedRecords`, `dataFlow`
- DPIA: `projectName`, `riskLevel`
- Risk model: `dataFlow`, optional `riskScore` (output remains hardcoded `HIGH`)
- Oversight: `controller`
- Rights: `rightType`, `subjectId`

Runtime validation enforces required fields, primitive types, enumerations, maximum lengths, and rejects unknown fields. The JSON body limit defaults to 32 KB.

## `GET /`

Returns the public dashboard file. Static assets, the manifest, and service worker are deliberately outside API authentication so ordinary browser navigation and PWA installation work.

## Audit and operations endpoints

`GET /audit/integrity` requires `audit:verify`; `GET /audit/export` requires `audit:export` and returns only the caller tenant's records. Access is audited. `/health` reports process liveness. `/ready` requires valid local audit integrity, active policy status, and receipt-signer availability; it is not production approval. `/metrics` requires the separate `x-metrics-token` credential and otherwise returns 404.