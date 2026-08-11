# Threat Model

## Scope and assets

Scope includes HTTP and mobile clients, Express API, orchestrator, agents, A2SPA keys, API credentials, payloads, logs, source, Copilot export, and future deployment systems. Critical assets are private keys, authorization integrity, personal data, audit evidence, service availability, and sovereign data-location guarantees.

## Actors and boundaries

Threat actors include unauthenticated internet users, credential thieves, malicious insiders, compromised dependencies, hostile clients, and compromised CI/deployment identities. Trust boundaries exist at client/API ingress, process environment, package supply chain, repository administration, Copilot import/export, and future persistence services.

## Priority threats

| Threat | Current exposure | Required mitigation |
|---|---|---|
| Stolen static API key | Key grants tier access without expiry/scope | Short-lived identity tokens, scopes, rotation, rate limits |
| Forged authorization | Server signs its own accepted request | External issuer, verified claims, key IDs, policy engine |
| Replay | Nonce not stored | Atomic nonce consumption with TTL |
| Payload ambiguity | `JSON.stringify` canonicalization | Versioned canonical schema/serialization |
| Injection/malformed input | No schemas | Strict validation and bounded payloads |
| Data leakage | Console payloads/errors | Redaction, minimization, structured audit policy |
| DoS | No rate/size controls | Ingress limits, quotas, timeouts, capacity alerts |
| Supply-chain compromise | Minimal tooling/CI | Lockfiles, review, SBOM, scanning, provenance |
| Key theft | Keys resident in process environment | Managed signer/HSM where warranted, least privilege |
| Insider/repository abuse | Governance not enforced server-side | Branch protection, reviews, signed/audited releases |

## Assumptions and residual risk

The host, Node runtime, secret source, and GitHub administration are assumed trustworthy but are not verified by the application. A2SPA does not mitigate a compromised process holding the private key. Regulatory correctness and domain outcomes are simulated. Revisit this model for every new external integration, identity system, data store, action, or deployment topology.