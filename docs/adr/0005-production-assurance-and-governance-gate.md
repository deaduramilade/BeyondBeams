# ADR-0005: Require evidence-based production assurance and institutional acceptance

Date: 2026-08-11

Status: Proposed

Decision owners: Project maintainers; deploying institution must approve deployment-specific decisions

## Context

The repository is a jurisdiction-neutral prototype for public-sector authorization and accountability. Implementation completeness cannot establish legal authority, privacy compliance, accessibility conformance, operational resilience, or acceptable residual risk. The current A2SPA prototype also does not demonstrate independent authorization issuance.

## Decision

Use a fail-closed, evidence-based production gate. A deployment remains `NOT_READY` until its scope, policy pack, independent security/privacy/legal/accessibility/operations assessments, remediation or justified exceptions, SLO/SLI and RTO/RPO approvals, key lifecycle evidence, supply-chain evidence, exercised incident and shutdown procedures, and residual-risk acceptance are documented by named authorized institutional roles. Track unresolved risks in `RISK_REGISTER.md` and the control framework in `PRODUCTION_ASSURANCE.md`.

Repository documents may provide templates and proposed starting targets, but must not fabricate institutional facts or accept deployment risk. Synthetic-only evaluation remains the default while requirements or approvals are unresolved.

## Alternatives considered

- Declare readiness from automated tests: rejected because tests do not establish institutional authority or independent assurance.
- Provide a global policy baseline: rejected because jurisdictional law, language, retention, rights, and service requirements differ.
- Treat maintainer review as institutional acceptance: rejected because it violates separation of duties and lacks delegated authority.

## Consequences

The gate can block a technically functioning deployment, which is intentional. Operators must maintain evidence, review expiry, and coordinate multiple authorities. Proposed pilot objectives are not contractual SLOs until approved. The existing `/execute` contract and development credential semantics remain unchanged.

## Security, privacy, and operations

Missing or invalid policy, approval, key, audit, persistence, monitoring, or recovery evidence must fail closed for governed operation. Emergency shutdown preserves required evidence and prevents reopening until reassessment and explicit approval.

## Validation and review date

Validation is documentation and process design only; no independent assessment or institutional approval has occurred. Review when a pilot jurisdiction, policy pack, persistence implementation, identity integration, or deployment target is proposed.
