# Security Policy

## Support and reporting

Only the latest `main` commit is supported during pre-production. Do not disclose vulnerabilities, credentials, personal data, or exploit details in public issues. Use GitHub private vulnerability reporting when enabled or a maintainer-approved private channel. Include the affected commit, impact, prerequisites, reproduction, and mitigation. Maintainers should acknowledge within two business days and triage within five; these are process targets, not contractual service levels.

## Credential policy

- Store production secrets in an approved secret manager, never Git or client bundles.
- Restrict and rotate API keys and `OWNER_PRIVATE_KEY`; audit retrieval.
- Treat all browser configuration as public and never place privileged credentials in client bundles.
- If exposure occurs, revoke first, preserve evidence, then coordinate history cleanup.

## Cryptographic status

The utility generates EC P-256 keys and signing uses SHA-256. Some source error messages incorrectly call these RSA keys. A2SPA has not received independent review and lacks persisted replay prevention, formal canonicalization, external authorization issuance, key identifiers, revocation, and algorithm agility. It is not a certified zero-trust control.

## Production gate

Do not expose this service to production until it has TLS, restricted CORS, schema and size validation, rate limiting, secret management, non-root execution, dependency scanning, tamper-evident audit logging, health/readiness endpoints, monitoring, tested recovery, key rotation, and independent security assessment.

## Incident handling

Contain affected services and credentials, preserve evidence, assess personal-data impact, notify accountable roles, recover from trusted artifacts, and complete a post-incident review. Qualified legal/privacy personnel must decide regulatory notifications.