# Operational Runbook

## Scope

This runbook describes the prototype and the minimum procedures a future operator must formalize. There is currently no supported production service.

## Start and stop

Validate configuration without printing values, verify the active signed policy and local audit integrity, start `node server.js` under a supervisor, and run a synthetic authorized request. Stop by draining ingress, sending `SIGTERM`, and confirming graceful close before the forced-close timeout.

## Health checks

`/health` reports process liveness. `/ready` checks local audit integrity, active policy, and receipt-signer availability. `/metrics` requires its separate scrape credential. Production probes must also cover identity, replay, database/queue/object storage, regional, and clock health without executing business actions.

## Incident triage

1. Establish incident command, severity, timeline, and communication channel.
2. Preserve logs and deployment metadata with access controls.
3. Contain affected credentials, ingress, or workloads.
4. Assess integrity, availability, confidentiality, and personal-data impact.
5. Recover from trusted artifacts; validate before reopening traffic.
6. Document decisions and complete follow-up actions.

## Common failures

- Startup fails: validate OIDC/JWKS URLs, trusted A2SPA/policy public keys, signed policy, absolute store paths, and development receipt key without printing values.
- All requests return 401: verify issuer/audience/JWKS, token lifetime, identity claims, and proxy header forwarding.
- A2SPA returns invalid signature: verify issuer/key ID, canonical envelope, payload digest, and key validity/revocation.
- Policy denies or readiness fails: verify institution, jurisdiction, purpose, principal type, human approval, activation, expiry, and revocation; use controlled rollback only when approved.
- Replay/audit/queue failure: stop consequential admission, preserve evidence, restore the approved service, verify integrity/idempotency, then reopen explicitly.
- Elevated 403: inspect action names and sanitized server errors.
- Suspected key exposure: revoke/rotate immediately, restrict access, preserve evidence, and assess history/log exposure.

## Routine operations

Review dependency alerts, centralized logs, authorization/replay anomalies, key and policy status, audit integrity, queue backlog/dead letters, clock offset, backups, restore/load tests, alert efficacy, and outstanding risks. See `OBSERVABILITY.md`, `PERSISTENCE.md`, and `POLICY_PACKS.md`; production cadence and ownership are not assigned.