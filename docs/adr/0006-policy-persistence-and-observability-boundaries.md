# ADR-0006: Separate governed policy and production service adapters

Date: 2026-08-12

Status: Proposed

Decision owners: Project maintainers; deploying institution approves policy and providers

## Context

The executor needs real policy decisions and testable persistence/operations contracts, while jurisdiction, cloud, database, queue, immutable storage, monitoring vendor, and operational targets remain unknown.

## Decision

Use signed immutable `beyondbeams.policy-pack/1` artifacts with distinct publication approvals, default-deny evaluation, institution/jurisdiction/purpose binding, deny precedence, human approval, rights/remedy metadata, revocation, rollback, and decision audit. Keep local file replay/audit/queue and in-process metrics as development reference adapters. Production must replace them with approved regional durable services without weakening A2SPA-R receipt semantics or fail-closed admission.

## Alternatives considered

- Hardcode one global jurisdiction: rejected because it would invent legal authority.
- Select a cloud provider now: rejected because sovereignty, procurement, RTO/RPO, and institutional requirements are absent.
- Continue digest-only policy checks: rejected because a digest alone cannot evaluate purpose, prohibition, approval, or rights.

## Consequences

Runtime policy decisions are testable and auditable, but policy correctness still requires independent jurisdictional validation. Adapter selection, migrations, transaction boundaries, immutable retention, backup/restore, capacity, tracing, alerts, SLOs, and on-call remain deployment gates.

## Security, privacy, and operations

Policy publisher, authorization issuer, and receipt signer keys remain separate. Required policy, replay, audit, identity, and signing failures deny operation. Telemetry excludes sensitive/high-cardinality values. No production readiness or approved operational target follows from this ADR.

## Validation and review date

Unit/integration tests cover synthetic policy and local queue behavior. Review when a real jurisdiction, persistence provider, operations platform, or independent assessor is proposed.
