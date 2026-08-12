# ADR-0007: Establish accessible governed-action and release-evidence baselines

Date: 2026-08-12

Status: Proposed

Decision owners: Project maintainers; deploying institution approves accessibility, workflow, and release controls

## Context

The PWA used inaccessible credential prompts, lacked localization and offline/manual-service notices, and had no tested conflict check for policy approvals. CI generated a short-lived SBOM but releases did not retain artifact checksums, scanner output, metadata, or provenance.

## Decision

Use semantic form controls and live errors, English/French interface resources, explicit connectivity and manual-service boundaries, and regression tests in the PWA. Reject self-approval and malformed approval records in policy evaluation. After protected-environment approval, verify a reviewed tag, generate the package, SBOM, dependency audit, checksums, metadata, and GitHub provenance attestation, then create the release with that evidence.

## Alternatives considered

- Claim WCAG conformance from source review: rejected because independent assistive-technology and deployment testing is required.
- Implement a generic appeals database without an institution: rejected because authority, identity, deadlines, records, and service channels are jurisdiction-specific.
- Treat CI scanner output as release approval: rejected because findings require qualified disposition and separation of duties.

## Consequences

The prototype has stronger accessible interaction, policy conflict controls, and durable release evidence, but remains `NOT_READY`. Institutions must independently assess accessibility, implement governed review/appeal/manual-service workflows, configure release approvals, and supply all legal, security, privacy, records, sovereignty, operational, and residual-risk evidence.

## Security, privacy, and operations

Browser credentials remain transient and are never stored or logged. Release artifacts contain no runtime secrets. Missing approval, policy, identity, evidence, or institutional service configuration continues to block consequential use.

## Validation and review date

Validate through deterministic tests, syntax/JSON checks, dependency audit, secret scan, and manual browser inspection. Review after an independent accessibility assessment, institutional workflow design, packaging change, or first governed release.