# Threat Model

## Scope and assets

Scope includes the browser/PWA client, Express API, orchestrator, agents, A2SPA keys, API credentials, payloads, logs, source, Copilot export, and future deployment systems. Critical assets are private keys, authorization integrity, personal data, audit evidence, service availability, and sovereign data-location guarantees.

## Actors and boundaries

Threat actors include unauthenticated internet users, credential thieves, malicious insiders, compromised dependencies, hostile clients, and compromised CI/deployment identities. Trust boundaries exist at client/API ingress, process environment, package supply chain, repository administration, Copilot import/export, and future persistence services.

## Priority threats

| Threat | Current exposure | Required mitigation |
|---|---|---|
| Stolen bearer or signing identity | Token/key usable within validity or custody scope | Short lifetimes, managed custody, least privilege, rotation/revocation, anomaly detection |
| Forged authorization | Issuer/key/configuration compromise | External issuer verification, key status, binding, signed policy, independent review |
| Replay | Local nonce store is single-host | Atomic consumption now; regional durable store and failure tests before production |
| Payload ambiguity | Canonical profile lacks independent review | Versioned canonical schema, digest binding, independent protocol review |
| Injection/malformed input | Hostile clients | Strict schemas, exact fields, bounded payloads, safe errors |
| Data leakage | Operational or audit export misuse | Redaction, minimization, scoped exports, retention/access controls |
| DoS | In-process rate limits and local stores | Ingress quotas, distributed limits, timeouts, capacity/load tests, alerts |
| Supply-chain compromise | Minimal tooling/CI | Lockfiles, review, SBOM, scanning, provenance |
| Key theft | Keys resident in process environment | Managed signer/HSM where warranted, least privilege |
| Insider/repository abuse | Governance not enforced server-side | Branch protection, reviews, signed/audited releases |
| Unsafe or forged policy pack | Publisher or configuration compromise | Separate publisher trust, signature/digest verification, dual approvals, binding, default deny, revocation/rollback, decision audit |
| Evidence loss or duplicate work | Local store loss, queue retry, regional outage | Durable adapters, idempotency/outbox, immutable exports, backup/restore tests, measured RTO/RPO |
| Monitoring blind spot | Local stdout or scrape outage | Central redacted collection, protected metrics, dependency/clock/key/policy/audit signals, tested alerts |

## Assumptions and residual risk

The host, Node runtime, secret source, publisher/key custody, and GitHub administration are assumed trustworthy but are not verified by the application. Local persistence is not resilient to host loss. A valid policy signature does not prove legal correctness. Regulatory correctness and domain outcomes are simulated. Revisit this model for every integration, data store, action, or deployment topology.