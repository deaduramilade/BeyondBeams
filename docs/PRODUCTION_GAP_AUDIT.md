# Production Gap Audit

**Reviewed:** 2026-08-13  
**Repository state:** Pre-production prototype; `NOT_READY`  
**Scope:** Phase 1 governed case workflow and the prerequisites for a named Phase 2 institutional deployment

This audit records what is present in the repository, what was omitted from the implemented workflow, which external handshakes are still only boundaries, and what must be built and evidenced before production use. Passing automated tests does not close an integration or assurance gap.

## Findings

### Requested production items

The selected scope was provider-neutral contracts and local synthetic test doubles only. “Contract implemented” below means an executable interface and deterministic synthetic test exist. It does not mean the Express runtime uses that interface or that a provider, institution, or independent assessor accepted it.

| Requested item | Repository evidence | Current disposition | Still required |
|---|---|---|---|
| Full OIDC Authorization Code + PKCE callback lifecycle | Provider-neutral login/callback routes and tests cover S256 exchange input, one-time callback state/nonce and session creation | Repository boundary complete; provider open | Select an OIDC adapter and test discovery, token exchange, claims, JWKS rotation, outage and recovery in staging |
| Server-managed browser sessions and rotation | Opaque `HttpOnly`/`SameSite` cookie issuance, rotation and predecessor invalidation are HTTP-tested | Repository boundary complete; provider open | Approved durable/encrypted session store, deployed cookie policy, fixation/renewal/concurrency tests and operational revocation |
| State and nonce consumption | State and nonce are random, bounded, consumed once and expiry/replay-tested through contract and HTTP layers | Repository boundary complete; provider open | Durable distributed one-time store and real-provider replay/failure evidence |
| CSRF on browser mutations | Every cookie-authenticated mutation enforces exact origin and a constant-time checked session token; browser/negative tests exist | Repository boundary complete; provider open | Validate ingress origin/proxy behavior and the selected distributed session provider in staging |
| Logout and identity-provider logout | Dashboard and HTTP route revoke local session, clear cookie and return a validated HTTPS provider logout URL | Repository boundary complete; provider open | Selected-provider end-session/back-channel behavior and tested staging browser journey |
| Session and token revocation | Synthetic session/key revocation and OIDC access-token `jti` hook exist | Partial reference only | Durable session/token revocation source, refresh-token handling, event propagation and outage behavior |
| Production authorization issuer | Process-bound issuer exists | Development reference only | Authenticated service boundary, idempotency, policy binding, KMS/HSM custody and interoperability evidence |
| KMS/HSM receipt and authorization signing | Managed-signer contract plus synthetic key rotation/revocation tests | Contract implemented; provider open | Approved KMS/HSM adapters, non-exportable custody, IAM, attestation, rotation/recovery and failover evidence |
| Transactional database and outbox | Synthetic transaction commits workflow and outbox together; migration/backup/restore tested | Contract implemented; provider open | Selected replicated database schema, isolation/tenant controls, migrations, contention, corruption, failover and timed restore evidence |
| Replicated queue and worker platform | Queue contract tests idempotency, lease, retry and dead letter | Contract implemented; provider open | Selected replicated service, worker deployment, visibility extension, poison isolation, replay approval and load/failure evidence |
| Immutable evidence and records storage | Synthetic record metadata, digest, retention and legal hold tested | Contract implemented; provider open | WORM/object-lock provider, encryption, tenant access, chain of custody, export/deletion and records-owner evidence |
| Actual file upload and malware scanning | Synthetic scanner rejects a fixed test marker; case API registers metadata only | Not implemented | Streaming upload/quarantine, limits, content validation, real scanner, signature updates, outage/release workflow and immutable clean-object promotion |
| Notification provider and receipts | Synthetic idempotent send and opaque destination digest/receipt tested | Contract implemented; provider open | Approved channels/templates, consent, localization, retry/outage/dead-letter, real delivery receipts and reconciliation |
| Document generation and accessibility validation | Synthetic structured document and basic language/title/section check tested | Contract implemented; conformance open | Actual document renderer, templates, PDF/UA or required format validation, manual/assistive-technology assessment and alternate formats |
| Policy publication and revocation service | Signed runtime registry plus synthetic external lifecycle contract | Contract implemented; provider open | Authenticated durable publisher, approvals, distribution, emergency suspension, cache invalidation, rollback and outage evidence |
| Central telemetry, alerting, clock and on-call | Synthetic redaction guard, clock offset and runbook-linked alert evaluation tested | Contract implemented; operations open | Central collector/APM/SIEM, delivery-tested alerts, trusted time monitoring, dashboards, approved thresholds and staffed rota |
| Backup, restore, migration and failure-injection evidence | In-memory synthetic backup/restore/migration and selected failure tests | Synthetic evidence only | Production-class isolated restores, measured RTO/RPO, data reconciliation, regional/provider loss, corruption, capacity and migration rollback exercises |
| Real browser/device and assistive-technology assessment | Source-level accessibility regression only | Not satisfied | Named browser/device matrix and qualified keyboard, zoom/reflow, screen-reader, speech, localization, interruption and document testing |
| Named institution, jurisdiction, records schedule, service channels and risk acceptor | None supplied; repository placeholders remain unresolved | Not satisfied | Accountable institution must approve and publish the exact deployment boundary and requirements |
| Independent security, privacy, legal, accessibility and operational assurance | No reports or named approvals supplied | Not satisfied | Commission qualified independent assessments, remediate/retest findings and record bounded acceptance |

### Governed workflow capabilities

Tenant-scoped case detail, filters, assignments, deadlines, escalation, notes, evidence metadata, suspension/resumption/cancellation, timelines, and structured decision/notice/correction/objection/appeal/remedy/override records now exist as development behavior. Complete role-specific UI journeys, recusal administration, actual delivery status, institution-approved reasons/deadlines/templates and immutable provider history remain open.

### Required handshakes and connections

These interfaces now have development adapters, executable contracts, or configuration fields, but every selected-provider handshake, trust establishment, runtime wiring, and production-class acceptance result remains open:

| Boundary | Required handshake/connection | Phase 1 acceptance evidence |
|---|---|---|
| OIDC identity broker | Authorization-code flow with PKCE, registered redirect/logout URIs, state and nonce validation, JWKS rotation, claim mapping, session lifecycle, clock policy | Contract tests, negative tests, rotation/outage tests, threat review, and staging identity-provider run |
| Authorization issuer | Service-to-service authenticated request binding tenant, actor, workload, action, payload digest, purpose, policy digest, expiry, and idempotency; separate issuer key custody | KMS/HSM-backed integration tests, key rotation/revocation/recovery evidence, issuer/verifier interoperability, and failure-injection results |
| Receipt signer | Managed signing request with key-version metadata, timeout, retry policy, no private-key export, and fail-closed admission | Provider contract test, custody review, unavailable/revoked/rotating-key exercises, and receipt verification evidence |
| Policy publication | Authenticated publication, signature verification, approval/separation of duties, activation, revocation, rollback, expiry, and emergency suspension | Staging publication pipeline, approval records, rollback/revocation exercise, and jurisdiction-neutral test pack |
| Transactional persistence | Database transactions for case, replay, idempotency, audit/outbox records with tenant constraints and migration compatibility | Concurrency, corruption, failover, migration, isolation, and restore tests |
| Queue and workers | Outbox-to-queue delivery, authenticated consumers, leases, at-least-once processing, idempotent effects, retry budgets, and dead-letter replay approval | Failure injection, duplicate delivery, poison message, backlog, and recovery evidence |
| Evidence and records | Append-only/WORM storage, digest/checkpoint linkage, encryption, retention/legal hold, export, deletion, and chain verification | Write/read integrity, legal-hold, retention, export, restore, and access-control tests |
| Notifications/manual service | Institution-approved email/SMS/portal/manual channels, delivery receipts, accessibility, language, outage fallback, and support escalation | End-to-end delivery and outage exercises with approved service-path evidence |
| Central operations | Authenticated telemetry transport, dashboards, alerts, traces, on-call routing, clock monitoring, and no sensitive labels | Alert delivery, dependency outage, audit-integrity, capacity, and incident exercises |

### Production development still required

The following are not repository-only documentation tasks and must be delivered by engineering, security, operations, and the deploying institution:

- Replace file-backed replay, audit, cases, and queue adapters with selected regional production services and tested transactional/outbox behavior.
- Replace process-bound authorization and receipt private keys with approved KMS/HSM services, including lifecycle ceremonies and recovery.
- Add durable evidence/object storage, encrypted backups, restore verification, retention, legal hold, deletion, and export controls.
- Implement centralized observability, approved SLO/SLA boundaries, RTO/RPO, capacity limits, alert ownership, and on-call operations.
- Complete threat modeling, penetration/security testing, privacy and data-governance review, dependency/vulnerability disposition, and independent assurance.
- Complete the product workflows for corrections, appeals, remedies, notices, overrides, deadlines, manual service, and outcome reporting.
- Select a named institution and jurisdiction, approve legal authority, purpose limits, policy pack, languages, accessibility requirements, records rules, support model, and residual-risk owner.
- Commission institution-specific identity, key, policy, data, document, notification, monitoring, support, and shutdown integrations.
- Exercise restore, failover, incident response, key compromise, policy suspension, manual-service continuity, rollback, shutdown, and decommissioning before live authorization.

## Two-phase execution plan

### Phase 1: Production-ready release candidate

**Purpose:** Finish the product and prove production-capable integrations in synthetic/staging environments. This phase does not authorize real personal data or consequential decisions.

1. Complete the remaining case, decision, notification, evidence, and operator HTTP/UI journeys; extend session UX only where the selected identity provider requires it.
2. Implement selected-provider adapters against the executable contracts for identity, issuer, signer, policy, database, queue, records, notification, document, scanning, and telemetry boundaries.
3. Integrate the selected staging providers and prove the handshakes, tenant isolation, fail-closed behavior, retries, idempotency, and audit/evidence linkage.
4. Complete security, privacy, accessibility, responsive, load, migration, backup/restore, incident, rollback, and release-candidate evidence.

**Exit gate:** No critical defect or unowned high risk; production-class staging integrations pass contract and failure tests; complete role/workflow journeys are usable; release, operations, and assurance evidence is reviewed. Result is `PRODUCTION_READY_CANDIDATE — synthetic/staging use only`.

### Phase 2: Named institutional move to live

**Purpose:** Configure and approve one exact deployment. Phase 2 cannot bypass missing Phase 1 evidence.

1. Approve the institution, jurisdiction, controller/service owner, purposes, prohibited uses, policy pack, languages, notices, records, rights/remedy, manual channels, support, and shutdown authority.
2. Commission isolated environments, approved regions, network ingress, certificates, identity, KMS/HSM, database, queue, object storage, backups, notifications, documents, monitoring, and support integrations.
3. Complete independent security, privacy, legal, accessibility, human-rights/fairness, localization, records, browser/device, and operational assessments; remediate and retest findings.
4. Run controlled pilot exercises for migration, smoke transactions, restore, incident response, key compromise, policy rollback/suspension, manual service, shutdown, decommissioning, and rollback.
5. Obtain named residual-risk acceptance and explicit institutional go-live approval for the exact artifact, configuration, data, purposes, and operating boundary.

**Exit gate:** Every applicable approval and evidence item is current, support/manual-service channels are active, rollback is tested, and the authorized institution permits real users and real data. Otherwise the deployment remains disabled and `NOT_READY`.

## Verification performed for this audit

- Repository and branch reviewed: `feature/global-public-sector-pwa`; existing user changes were preserved.
- Current automated baseline: 43/43 tests and syntax checks pass, including five provider-contract suites, property-style canonicalization invariants, and provider-neutral identity/session HTTP lifecycle coverage.
- JSON parsing, dependency audit, tracked-file secret scan, and whitespace validation are rerun for each completed tranche; expected Git CRLF conversion warnings are not whitespace errors.
- The tracked repository-only checklist is `docs/REPOSITORY_READINESS_CHECKLIST.md`; each completed row cites executable or documentary evidence.

The verification results establish repository integrity for the inspected changes. They do not close the implementation, integration, or independent-assurance gaps above.