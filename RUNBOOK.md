# Operational Runbook

## Scope

This runbook describes the prototype and the minimum procedures a future operator must formalize. There is currently no supported production service.

## Start and stop

Validate required environment variables without printing values, start `node server.js` under a supervisor, and verify a locally authorized request. Stop by draining ingress, terminating gracefully when implemented, and confirming no requests remain. The current process lacks explicit graceful-shutdown handling.

## Health checks

No dedicated health or readiness endpoints exist. Process existence and an authenticated synthetic action are temporary checks only and may trigger business logic. Implement dependency-aware endpoints before production.

## Incident triage

1. Establish incident command, severity, timeline, and communication channel.
2. Preserve logs and deployment metadata with access controls.
3. Contain affected credentials, ingress, or workloads.
4. Assess integrity, availability, confidentiality, and personal-data impact.
5. Recover from trusted artifacts; validate before reopening traffic.
6. Document decisions and complete follow-up actions.

## Common failures

- Startup fails: validate JSON `API_KEYS` and matching PEM variables.
- All requests return 401: verify the key mapping and proxy header forwarding.
- A2SPA returns invalid signature: verify key pairing, line breaks, and absence of mutation.
- Elevated 403: inspect action names and sanitized server errors.
- Suspected key exposure: revoke/rotate immediately, restrict access, preserve evidence, and assess history/log exposure.

## Routine operations

Review dependency alerts, access logs, key age, backups, restore tests, capacity, alert efficacy, and outstanding risks. Production cadence and ownership must be set before launch.