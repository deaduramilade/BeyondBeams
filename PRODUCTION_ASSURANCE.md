# Production Assurance and Governed Operation

**Status:** Required control framework; no production approval recorded

**Last reviewed:** 2026-08-11

## Purpose and boundary

This document defines the evidence and approvals required before a deployment of Oblivion-AI may process real data or support consequential operational decisions. It is a governance and assurance checklist, not an assessment, certification, legal opinion, service-level agreement, or risk acceptance.

The repository currently contains a pre-production prototype. Its `/execute` endpoint and simulated agents are development demonstrations and must not be treated as jurisdictional authorization, a legal determination, or production identity. Pilot remedy workflows, if implemented, must use synthetic records until an institution approves the applicable processing.

The deployment boundary must be completed per institution and jurisdiction. At minimum it must identify the controller and service owner, users and affected people, ingress and egress, identity provider, signing/key service, policy-pack source, persistence and audit stores, backups, operators, support access, subprocessors, data locations, and shutdown authority. The approved boundary belongs in the deployment's controlled evidence set; this repository does not supply it.

## Non-negotiable assurance gate

The service is **NOT_READY** unless every applicable gate below has current evidence and named approval. A completed implementation, passing automated test, or healthy process does not satisfy the gate.

## Two-phase interpretation

The assurance work is divided into two gates in [Production Readiness and Live-Service Roadmap](PRODUCTION_ROADMAP.md):

1. **Phase 1: Production Ready** establishes a production-capable release candidate. It covers the complete guided user and operator workflows, an optional explicitly selected and equivalently validated JSON payload path, durable case and review state, production persistence and key interfaces, security and policy controls, responsive and accessible experience across mobile, tablet, desktop, and widescreen layouts, resilience, operations, and release evidence. Its exit status is **PRODUCTION_READY_CANDIDATE — synthetic/staging use only** and does not authorize real personal data or consequential decisions.
2. **Phase 2: Move to Live** applies that release candidate to one named institution and jurisdiction. It adds the approved legal and service scope, real deployment boundary, sovereign infrastructure, institution-specific identity and policy, independent assessments, accessible digital and non-digital service routes, measured operational acceptance, residual-risk acceptance, and explicit controlled go-live approval.

Phase 1 completion is therefore a technical readiness decision, not a production-use approval. Any missing, expired, disputed, or failed Phase 2 gate keeps the deployment disabled.

| Gate | Required evidence | Required accountable approval | Current repository state |
|---|---|---|---|
| Scope and threat model | Approved architecture, data-flow diagram, abuse cases, residual-risk review | Service owner and security authority | Outstanding; repository threat model is provisional |
| Independent security assessment | Independent report, findings, remediation or documented justification, retest | Security authority | Not supplied |
| Privacy and data governance | DPIA/PIA, processing inventory, lawful-basis and minimization review, retention schedule, transfer review | Privacy/legal authority and controller | Not supplied |
| Legal, rights, and policy | Jurisdiction, authority, languages, notices, human review, appeals, remedy, prohibited uses | Named institutional legal/rights authority | Not supplied |
| Accessibility and inclusion | Independent WCAG/accessibility assessment, assistive-technology and low-bandwidth evidence, non-digital service path | Accessibility authority and service owner | Engineering baseline added; independent evidence not supplied |
| Operations and resilience | SLO/SLI approval, monitoring, on-call, incident exercise, backup restore test, measured RTO/RPO | Service owner and operations authority | Not supplied |
| Supply chain and release | Lockfile, SBOM, provenance, vulnerability disposition, artifact verification, release record | Release authority and security reviewer | Release evidence automation added; no protected approval or production evidence supplied |
| Key lifecycle | Generation, custody, rotation, revocation, recovery, retirement and access-review evidence | Key custodian and security authority | Development environment variables only |
| Shutdown and exit | Exercised emergency shutdown/decommissioning record, evidence preservation, deletion/return plan | Named shutdown authority and records owner | Not exercised |
| Residual-risk acceptance | Complete [risk register](RISK_REGISTER.md), owners, mitigations, expiry, acceptance authority | Named institution/person with delegated authority | No acceptance recorded |

Any failed, expired, disputed, or missing gate keeps the deployment disabled. Approvals must be independent where separation of duties requires it; the implementer cannot be the sole assessor or risk acceptor.

## Assurance workstreams

### Independent assessments

Assessments must be scoped to the actual deployment, version, jurisdiction, data, integrations, and intended uses. Each report records assessor independence and competence, assessment dates, methodology, evidence examined, findings with severity, remediation or justification, retest results, residual risk, and expiry/reassessment triggers. Required workstreams are security, privacy, legal/rights, accessibility, and operations/resilience. No report or result is implied by this repository.

### Key-management lifecycle

Production signing and authorization keys must be generated using an approved cryptographic process, uniquely identified, and held by an approved KMS/HSM or equivalent controlled signer where the threat model requires it. The lifecycle record must include:

1. dual-control generation and verification of key identity and algorithm;
2. least-privilege use, non-exportability where feasible, access logging, and separation of issuer/verifier roles;
3. planned rotation with overlapping verification keys, bounded transition, and tested rollback;
4. immediate revocation and incident handling for suspected compromise, including affected receipt/action analysis;
5. encrypted recovery material with split custody, access approval, and restoration testing;
6. retirement, destruction or cryptographic erasure, metadata retention, and proof that retired keys cannot authorize new actions.

Private keys, credentials, recovery material, and production identifiers must never be committed, logged, or placed in browser assets. Development PEM environment variables do not constitute production key management.

### Service objectives and resilience

SLOs are deployment-specific and require service-owner approval. The following are proposed starting targets for synthetic pilot evaluation only, not promises or approvals:

| SLI | Proposed pilot target | Measurement and alert condition |
|---|---|---|
| Availability | 99.5% monthly for authenticated pilot APIs, excluding approved maintenance | Successful eligible requests and health intervals; page on burn-rate breach |
| API latency | p95 <= 750 ms, p99 <= 2 s for non-queued synthetic requests | Ingress-to-response histogram; alert on sustained breach |
| Error rate | <= 1% 5-minute rate and <= 0.5% monthly | Redacted status/code metrics; page on sustained elevated errors |
| Audit/persistence durability | 99.9% of accepted writes durably acknowledged | Integrity-chain and flush/backup metrics; stop admission on failure |
| Remedy notification | 99% of accepted synthetic notifications queued within 60 s | Queue age and delivery outcome; escalate on backlog |

No target becomes an SLO until the institution approves the measurement window, exclusions, maintenance policy, timezone, service hours, escalation contacts, and consequences of breach. Proposed starting objectives are not evidence of performance.

RTO and RPO must be approved after a business-impact analysis. Until then, production RTO/RPO are **UNRESOLVED** and readiness remains `NOT_READY`. Restore tests must measure actual recovery time and data loss, verify integrity and authorization behavior, and preserve the test record.

### Supply chain and release assurance

Every deployable release must be traceable to a reviewed commit and produce a locked dependency installation, SBOM, artifact digest, build/provenance record, dependency and artifact vulnerability results, license review, test results, secret-scan results, and approval record. Critical/high findings require remediation or a time-bounded, explicitly accepted exception. Releases must be promoted as the same verified artifact from staging; emergency releases receive retrospective review and evidence preservation.

### Monitoring and auditability

Monitor availability, latency, errors, saturation, authentication failures, rate limiting, policy-pack integrity/status, authorization rejection reasons, persistence-chain health, backup age, restore-test age, key age/status, notification backlog, remedy aging, and shutdown state. Alerts must have an owner, severity, threshold, runbook, escalation path, deduplication, and test cadence. Never record credentials, keys, raw payloads, contact details, or unnecessary subject identifiers in diagnostic logs. Audit evidence must be integrity-protected, access-controlled, time-synchronized, exportable, retained under an approved schedule/legal hold, and deletion-tested.

### Incident response and communication

The institution must name an incident commander, security lead, privacy/legal lead, service owner, communications lead, records owner, and alternates. The procedure is: detect and classify; declare and assign command; preserve volatile and audit evidence; contain ingress, credentials, keys, policy activation, or affected workflows; assess confidentiality/integrity/availability and affected people; obtain legal/privacy decisions on notification; communicate through approved channels; recover from trusted artifacts; validate authorization, audit, backups, and monitoring; reopen only by explicit authority; and complete a blameless post-incident review with corrective actions and due dates. Exercise this procedure before launch and at an approved recurring cadence. Do not invent notification deadlines; the applicable authority and legal counsel must set them.

### Appeals, remediation, and transparency

Consequential outcomes require an intelligible notice where lawful, a human review route, correction/objection/appeal intake, accessible status updates, manual/non-digital service information, identity and authorization checks, conflict-free review, reason codes, deadlines approved for the jurisdiction, and a remedy/escalation path. A receipt proves recorded processing only; it does not prove legality, correctness, fairness, or entitlement. Publish or internally approve the policy, purposes, limitations, oversight contact, evidence-access rules, aggregate outcomes, incidents, appeals, and remediation metrics without exposing protected data.

### Emergency shutdown and decommissioning

The shutdown authority must be named and the procedure exercised. On trigger (integrity concern, unauthorized use, key compromise, unsafe policy, loss of audit/persistence, material legal direction, or unrecoverable monitoring failure):

1. stop new consequential admissions and disable policy activation fail-closed;
2. preserve logs, audit chains, policy versions, deployment digests, key metadata, and incident timeline under records controls;
3. revoke or disable affected credentials, signing keys, integrations, and scheduled jobs;
4. communicate service status and manual-service alternatives through approved accessible channels;
5. export and verify required evidence, take an approved immutable backup, and document chain integrity;
6. decommission only after records/legal-hold, data return/deletion, access removal, secret destruction, DNS/ingress, monitoring, and dependency closure checks;
7. obtain named sign-off from the shutdown authority, records owner, security authority, and service owner.

The service must not resume until a new readiness evaluation, incident review, required remediation, and explicit reopening approval are complete.

## Residual risk and acceptance

All unresolved risks are tracked in [RISK_REGISTER.md](RISK_REGISTER.md). Each entry requires a unique ID, affected scope, owner, severity, likelihood/impact rationale, mitigation or justification, evidence, due date, expiry/review date, and named acceptance authority. “Accepted” means an authorized institution explicitly accepted the described residual risk; repository maintainers cannot accept institutional, legal, privacy, or deployment risk on its behalf.

## Current conclusion

Signed policy, queue, audit/replay, and metrics reference implementations now exist, but no independent assessments, real jurisdictional pack, authority, institutional deployment boundary, persistence/telemetry providers, named risk acceptor, approved SLO/RTO/RPO, exercised restore/incident procedures, or production evidence were supplied. Therefore the only supported status is **NOT_READY — development/synthetic evaluation only**.
