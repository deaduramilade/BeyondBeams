# Security Policy

## Support and reporting

Only the latest `main` commit is supported during pre-production. Do not disclose vulnerabilities, credentials, personal data, or exploit details in public issues. Use GitHub private vulnerability reporting when enabled or a maintainer-approved private channel. Include the affected commit, impact, prerequisites, reproduction, and mitigation. Maintainers should acknowledge within two business days and triage within five; these are process targets, not contractual service levels.

## Credential policy

- Store production secrets in an approved secret manager, never Git or client bundles.
- Restrict, scope, expire, and rotate OIDC clients/tokens, issuer/publisher/receipt signing identities, metrics credentials, and store credentials; audit use and retrieval.
- Treat all browser configuration as public and never place privileged credentials in client bundles.
- If exposure occurs, revoke first, preserve evidence, then coordinate history cleanup.

## Cryptographic status

The protocol uses P-256/ES256 and SHA-256 with versioned canonical serialization. A2SPA-R envelopes are externally verified, nonces are consumed by a local atomic replay store, signed receipts link authorization/payload/policy digests, and policy packs have separate publisher signatures and revocation/rollback state. Independent cryptographic review, selective disclosure, and production KMS/HSM custody remain open. This is not a certified zero-trust control.

## Production gate

Do not expose this service to production until it has TLS, approved identity/authorization and policy publication, secret management, non-root execution, dependency scanning, replicated tamper-evident audit, durable replay, managed signing, centralized monitoring, tested backup/restore, key/policy rotation, incident exercises, and independent assessments. Current controls are prototype hardening, not production approval.

## Incident handling

Contain affected services and credentials, preserve evidence, assess personal-data impact, notify accountable roles, recover from trusted artifacts, and complete a post-incident review. Qualified legal/privacy personnel must decide regulatory notifications.