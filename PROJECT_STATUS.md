# Project Status

**Phase:** Pre-production prototype

**Overall status:** Development only; not approved for production or real personal data

**Last reviewed:** 2026-08-12

**Integration branch:** `main`

## Completed

- Imported Copilot Studio unmanaged solution version 1.0.0.2.
- Implemented Express endpoint, browser/PWA dashboard, orchestrator, and five simulated domain agents.
- Implemented prototype EC signing/verification and development key generation.
- Removed hardcoded API credentials and LAN address; introduced runtime configuration.
- Established atomic Git history, feature-branch workflow, and initial documentation suite.
- Removed the discontinued native client and its dependency tree.
- Adopted a jurisdiction-neutral public-sector charter, private-source governance model, and A2SPA-R target profile.
- Defined the production-assurance gate and initial residual-risk register; no external assessment, approval, or risk acceptance is recorded.
- Added signed versioned policy packs with approval validation, institution/jurisdiction and purpose binding, prohibited rules, human approval, rights/remedy metadata, decision audit, revocation, and rollback.
- Added provider-neutral file queue and metrics reference adapters with idempotency, leases, retries, dead letters, dependency readiness, and protected metrics export.
- Added semantic localized PWA development controls, offline/manual-service boundary messaging, policy self-approval denial, and deterministic accessibility regression checks.
- Added release evidence automation for packaged artifacts, retained SBOM/audit/checksum/metadata, and GitHub provenance attestations; institutional release approval and vulnerability disposition remain external gates.

## In progress

| Work | State | Exit condition |
|---|---|---|
| Documentation baseline | In review | Documentation PR approved and merged |
| Repository governance | Partial | GitHub branch protection and required checks enabled |
| Global policy-pack model | Synthetic implementation | One independently reviewed jurisdictional implementation validated |
| A2SPA-R action receipts | Development implementation | Production KMS/HSM, immutable store, and independent review |
| Persistence and resilience | Reference adapters | Regional services, backup/restore, measured RTO/RPO, load evidence |
| Monitoring and operations | Reference metrics/runbooks | Central collection, approved SLOs, on-call, exercises |
| Accessibility and service inclusion | Engineering baseline | Independent WCAG/assistive-technology evidence and approved institutional manual-service path |
| Consequential-action safeguards | Policy baseline | Authorized conflict-free review, appeals/correction intake, overrides, fairness evaluation, and durable workflow state |
| Release assurance | Repository automation | Protected environment, signed release approval, vulnerability dispositions, and production retention evidence |

## Immediate backlog

- [x] Replace syntax-only `npm test` with a deterministic automated suite and CI workflow.
- [x] Centralize duplicated A2SPA implementation and remove JS/TS divergence.
- [x] Design external authorization issuance and persisted nonce consumption.
- [x] Add strict request/action schemas, payload limits, restricted CORS, rate limits, and safe errors.
- [x] Add health/readiness, structured redacted events, and graceful shutdown.
- [x] Correct `.env.example` to represent OIDC, authorization, policy, receipt, persistence, and metrics configuration safely.
- [x] Resolve the package metadata conflict by marking the private package `UNLICENSED`.
- [x] Establish CI dependency, syntax, JSON, and tracked-file credential scans.
- [x] Implement A2SPA-R envelope, receipt, replay, audit, revocation metadata, and verifier contracts; selective disclosure remains open.
- [x] Implement signed policy-pack verification and default-deny policy decisions.
- [x] Add reference queue/idempotency and protected low-cardinality metrics.
- [ ] Obtain independent WCAG/assistive-technology, browser/device, localization, low-bandwidth, and non-digital-service evidence for a named deployment.
- [ ] Implement an institution-approved durable human-review, correction, appeal, conflict-assignment, override, and outcome-quality workflow.

## Production blockers

- [ ] Approved architecture and threat model
- [ ] Independent security assessment and remediation
- [ ] Privacy impact assessment, processing inventory, and lawful-basis review
- [ ] Production secret/key lifecycle and access controls
- [ ] Production durable audit/replay/queue/object storage, backup, restoration, incident, and operations evidence
- [ ] Independently validated jurisdictional policy pack and approved publication/rollback custody
- [ ] Deployment platform, sovereignty evidence, SLOs, RTO/RPO, and accountable approvals
- [ ] Complete the evidence-based production gate in [Production Assurance](PRODUCTION_ASSURANCE.md)

## Known risks

The development receipt signer remains process-bound; local persistence is single-host; policy packs are synthetic and publication is configuration-driven; compliance outcomes remain simulated; accessible PWA controls have not been independently assessed; consequential review/appeal workflows are not implemented; selective disclosure, production custody, centralized observability, approved SLO/RTO/RPO, and independent assessments remain open.

The production-assurance register records additional unresolved dependencies: no jurisdiction or approved policy pack, no independent security/privacy/legal/accessibility/operations assessments, no named institutional risk acceptor, no approved SLO/RTO/RPO, and no exercised shutdown/decommissioning procedure. The supported conclusion remains **NOT_READY — development/synthetic evaluation only**.

## Next recommended action

Select a pilot institution/jurisdiction and complete independent policy, security, privacy, accessibility, persistence, restore, operations, and rights/remedy validation. Every status update should cite a pull request or commit.

## Update history

| Date | Change |
|---|---|
| 2026-08-11 | Established audited repository and documentation baseline |
| 2026-08-11 | Added production-assurance governance framework and open residual-risk register; status remains NOT_READY |
| 2026-08-12 | Added signed policy authorization, reference queue/metrics adapters, and production architecture/runbook boundaries; status remains NOT_READY |
| 2026-08-12 | Added accessibility/service-inclusion engineering baseline, policy self-approval denial, and release evidence automation; status remains NOT_READY |