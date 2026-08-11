# HTTP API

## Base and authentication

The server defaults to `http://127.0.0.1:3000`. Every current route passes through API-key middleware. Send `x-api-key: <configured value>`. TLS is not implemented in-process and must be terminated by trusted ingress before non-local use.

## `POST /execute`

Request:

```json
{"actionType":"realtime.defense.breach.detect","payload":{"breachId":"EXAMPLE-001","affectedRecords":10,"dataFlow":"example"}}
```

Supported exact action names are `realtime.defense.breach.detect`, `compliance.automation.dpia.generate`, `predictive.analytics.risk.model`, `regulatory.oversight.perform`, and `rights.management.exercise`. The router currently accepts any suffix under a recognized prefix, which is a known validation defect.

Success envelope:

```json
{"success":true,"tier":"developer","result":{"status":"breach_handled","actionType":"realtime.defense.breach.detect","a2spaVerified":true,"timestamp":"2026-01-01T00:00:00.000Z"}}
```

| Status | Meaning |
|---:|---|
| 200 | Agent returned a result |
| 400 | `actionType` is missing |
| 401 | API key missing or unknown |
| 403 | Unknown action, signature failure, or any agent exception |

Errors contain `{ "success": false, "error": "..." }`. Internal messages are currently exposed and should be redacted in production.

## Payload fields

- Breach: `breachId`, `affectedRecords`, `dataFlow`
- DPIA: `projectName`, `riskLevel`
- Risk model: `dataFlow`, optional `riskScore` (output remains hardcoded `HIGH`)
- Oversight: `controller`
- Rights: `rightType`, `subjectId`

No runtime schema validation currently enforces these fields or types. Clients must not rely on that permissiveness.

## `GET /`

Returns the dashboard file when authorized. Static assets are also behind authentication middleware, although ordinary browser navigation cannot set `x-api-key`; this ordering requires redesign.