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

## Two-phase path to live service

All remaining development and deployment work is structured in [Production Readiness and Live-Service Roadmap](PRODUCTION_ROADMAP.md).

| Phase | Purpose | Current state | Exit status |
|---|---|---|---|
| Phase 1: Production Ready | Complete the product, governed workflows, production service adapters, security, responsive and accessible UX, resilience, operations, and release evidence | Not complete; prototype controls and reference adapters only | `PRODUCTION_READY_CANDIDATE` for synthetic staging evaluation; not authorized for real data |
| Phase 2: Move to Live | Configure and independently assess one named institutional deployment, commission its infrastructure and service channels, exercise operations, accept residual risk, and authorize a controlled launch | Not started; institution and jurisdiction are unresolved | `LIVE` only for the exact approved artifact, configuration, institution, jurisdiction, purposes, and operating boundary |

### Phase 1 summary

- Replace token and authorization-JSON entry with normal sign-in, guided workflow forms, review/confirmation, and server-side authorization issuance.
- Implement durable case management, role separation, conflict-free review, decisions, notices, corrections, appeals, remedies, overrides, notifications, administration, and outcome measures.
- Integrate production identity, authorization, KMS/HSM, database, queue, immutable evidence, backup, monitoring, and release services with failure-safe contracts.
- Complete security, privacy engineering, policy lifecycle, load, restore, incident, rollback, and release-candidate evidence.
- Validate all workflows across mobile, tablet, desktop, and widescreen layouts, including portrait/landscape, zoom/reflow, keyboard, assistive technology, localization, low bandwidth, and interrupted sessions.

### Phase 2 summary

- Approve the named institution's legal, policy, service, rights/remedy, records, language, accessibility, support, and accountability requirements.
- Commission sovereign production infrastructure and institution-specific identity, key, policy, data, notification, document, monitoring, and support integrations.
- Complete independent security, privacy, legal, accessibility, browser/device, localization, fairness, records, and operational assessments; remediate and retest findings.
- Prove the configured deployment on supported phones, tablets, desktops, and widescreen displays with real institutional content and complete user/operator journeys.
- Exercise restoration, incident response, manual-service continuity, rollback, key compromise, policy suspension, shutdown, and decommissioning before explicit go-live approval and a bounded rollout.

Passing Phase 1 does not imply Phase 2 approval. Missing or expired Phase 2 evidence keeps real users and real data disabled.

## Known risks

The development receipt signer remains process-bound; local persistence is single-host; policy packs are synthetic and publication is configuration-driven; compliance outcomes remain simulated; accessible PWA controls have not been independently assessed; consequential review/appeal workflows are not implemented; selective disclosure, production custody, centralized observability, approved SLO/RTO/RPO, and independent assessments remain open.

The production-assurance register records additional unresolved dependencies: no jurisdiction or approved policy pack, no independent security/privacy/legal/accessibility/operations assessments, no named institutional risk acceptor, no approved SLO/RTO/RPO, and no exercised shutdown/decommissioning procedure. The supported conclusion remains **NOT_READY — development/synthetic evaluation only**.

## Next recommended action

Execute Phase 1 of [Production Readiness and Live-Service Roadmap](PRODUCTION_ROADMAP.md) while selecting a pilot institution and jurisdiction for Phase 2. Every status update should cite a pull request or commit and the applicable phase exit evidence.

## Update history

| Date | Change |
|---|---|
| 2026-08-11 | Established audited repository and documentation baseline |
| 2026-08-11 | Added production-assurance governance framework and open residual-risk register; status remains NOT_READY |
| 2026-08-12 | Added signed policy authorization, reference queue/metrics adapters, and production architecture/runbook boundaries; status remains NOT_READY |
| 2026-08-12 | Added accessibility/service-inclusion engineering baseline, policy self-approval denial, and release evidence automation; status remains NOT_READY |
| 2026-08-12 | Structured all remaining work into Production Ready and Move to Live phases, including responsive acceptance across mobile, tablet, desktop, and widescreen; status remains NOT_READY |