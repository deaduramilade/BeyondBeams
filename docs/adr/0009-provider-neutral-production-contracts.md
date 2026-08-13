# ADR-0009: Define provider-neutral production integration contracts

Date: 2026-08-13

Status: Accepted for synthetic/staging implementation

Decision owners: Project maintainers; deploying institution owns provider selection and acceptance

## Context

Production capabilities require identity, managed keys, transactional persistence, queues, immutable records, scanning, notifications, documents, policy publication, and telemetry services. No institution, jurisdiction, approved region, procurement decision, or provider has been supplied. Selecting a provider or claiming production controls would therefore be unsupported.

## Decision

Define explicit JavaScript contracts for each integration boundary and deterministic in-memory synthetic providers. Contract tests exercise OIDC Authorization Code + PKCE semantics, state/nonce consumption, session rotation/revocation, CSRF, logout, managed signing/rotation/revocation, transaction/outbox behavior, migration/backup/restore, queue retry/dead-letter handling, immutable record metadata, malware rejection, retention/legal hold, notification receipts, structural document checks, policy publication/revocation, redacted telemetry, clock checks, and alert evaluation.

The synthetic platform is test infrastructure only. It is not wired as a permissive runtime fallback and cannot be selected for real data. A production adapter must implement the same contract and pass contract, integration, rotation, resilience, restore, accessibility, and failure-injection acceptance against institution-approved services.

## Alternatives considered

- Select a cloud stack without an institutional decision: rejected because sovereignty, procurement, regions, contracts, and accountable ownership are unknown.
- Describe interfaces only in prose: rejected because executable contracts catch semantic drift.
- Represent in-memory tests as production controls: rejected because they supply no external custody, durability, delivery, monitoring, or assurance evidence.

## Consequences

Provider selection can proceed against a concrete minimum interface and reusable synthetic acceptance suite. Repository work closes contract-definition gaps only; every production handshake and every institution-owned assurance gate stays open.

## Security, privacy, and operations

Synthetic providers accept synthetic data only, keep state in process memory, redact notification destinations, reject sensitive telemetry fields, and fail closed on invalid state, sessions, CSRF, revoked keys, malware markers, missing records, and revoked policy. They offer no availability, confidentiality, sovereign residency, immutable physical retention, actual malware engine, delivery, PDF/UA or WCAG conformance, or independent assurance.

## Validation and review date

Run `npm test`, `npm run check`, dependency audit, JSON parsing, secret scan, and `git diff --check`. Review this decision when a target institution or provider profile is selected.