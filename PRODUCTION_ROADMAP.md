# Production Readiness and Live-Service Roadmap

**Current status:** Pre-production prototype; neither phase is complete

**Rule:** Phase 2 cannot begin its live-service acceptance gate until the Phase 1 exit gate is complete. Completion of Phase 1 means the product is technically ready to be evaluated for a named deployment. It does not authorize real personal data, consequential decisions, or public use.

The omission and integration audit for this roadmap is maintained in [Production Gap Audit](docs/PRODUCTION_GAP_AUDIT.md). It distinguishes incomplete product workflows from provider handshakes and institution-owned live-service approvals.

Provider-neutral contracts and local synthetic test doubles now define the minimum lifecycle for identity/session, signing, persistence/outbox, queues, records/scanning, notifications, documents, policy, and telemetry. This completes contract definition only. Phase 1 still requires runtime integration with selected production-class staging providers and all exit evidence below.

## Phase 1: Production Ready

### Objective

Produce a secure, operable, accessible release candidate with complete institutional workflows and production-capable service adapters. Development and assurance testing remain synthetic until a named institution approves otherwise.

### 1. Guided user and operator experience

- Replace bearer-token entry in normal use with standards-based sign-in, an authenticated session, and server-side authorization issuance. Guided forms are the default input method and must not require users to obtain, edit, or paste an A2SPA-R authorization envelope.
- Provide an optional input-method radio group with **Guided form** selected by default and **JSON input** available for users who already have compatible structured action data. The JSON textarea must remain hidden or disabled until **JSON input** is selected, and switching back to **Guided form** must disable the textarea without silently submitting its contents.
- Treat optional JSON as action payload input, not as permission to bypass identity, policy, approval, or A2SPA-R controls. Parse it with a structured JSON parser, reject malformed, unknown, oversized, or schema-invalid fields, display errors next to the control, show the normalized data on the same review/confirmation screen, and obtain the signed authorization envelope through the trusted server-side service after validation.
- Restrict full authorization envelopes, signatures, tokens, and protocol diagnostics to appropriately authorized diagnostic roles. Never ask an ordinary user to place private keys or credentials in the JSON field, and do not persist JSON drafts in browser storage unless an institution explicitly approves the data-handling design.
- Implement guided forms for breach response, impact assessment, risk modelling, oversight review, and rights/remedy. Use appropriate text, number, date, select, radio, checkbox, file-upload, review, and confirmation controls with plain-language validation.
- Add drafts, resume, cancellation, duplicate prevention, review summaries, submission confirmation, clear case references, status history, next steps, and understandable result summaries. Technical receipts remain available as evidence without becoming the primary user result.
- Provide complete loading, empty, validation, permission-denied, conflict, timeout, offline, expired-session, partial-failure, and recovery states in English and French.

**Exit evidence:** Usability-tested end-to-end journeys for every role and workflow; no ordinary journey requires token or JSON entry; guided forms are selected by default; the JSON field becomes operable only after explicit radio selection; both input methods receive equivalent schema validation, review, authorization, policy, audit, error, interruption, and recovery controls.

### 2. Case management and governed decisions

- Implement a durable case state machine covering draft, submitted, triage, assigned, recommendation, pending review, approved or denied decision, notice, correction, objection, appeal, remedy, override, and closure.
- Add queues, search, filters, sorting, assignment, reassignment, deadlines, escalation, supporting evidence, case notes, and a complete status timeline with tenant isolation.
- Separate requester, reviewer, approver, auditor, support, policy publisher, and administrator responsibilities. Enforce delegated authority, conflict checks, recusal, reassignment, and separation of duties at the API and data layers.
- Record accountable human decisions, approved reason codes, intelligible explanations, source-data corrections, and notice delivery. Models remain advisory and cannot become the institutional decision maker.
- Govern overrides with scoped authority, justification, before/after values, expiry, dual approval where required, immutable evidence, and retrospective review.

**Exit evidence:** State-transition and authorization tests, concurrency and idempotency tests, role and conflict matrix, immutable decision history, and demonstrated correction, appeal, remedy, override, and closure journeys.

### 3. Backend and integration services

- Add workflow-oriented endpoints that accept validated form data and obtain or construct the exact signed A2SPA-R authorization envelope through a trusted service. The browser must not sign institutional authorization or supply private keys.
- Integrate production-compatible identity, session, issuer, policy publication, receipt signing, notification, document scanning, and records interfaces behind provider-neutral contracts.
- Validate all external input server-side, bind every action to tenant, actor, workload, purpose, policy, payload digest, and authorization, and preserve fail-closed behavior when required dependencies are unavailable.
- Version API and event contracts, define compatibility and migration rules, and provide safe idempotency, retry, timeout, cancellation, and error semantics.

**Exit evidence:** Contract and integration tests against production-like services, threat-reviewed trust boundaries, failure-injection results, API documentation, and no privileged credential or authorization responsibility in the browser.

### 4. Production persistence and evidence

- Replace single-host file adapters with a transactional database for cases, workflow state, policy metadata, revocation, replay, and idempotency; a durable queue with leases and dead-letter isolation; and append-only or WORM-capable storage for receipts, audit checkpoints, and governed documents.
- Implement transactional outbox and at-least-once processing patterns so state, effects, audit, and notifications remain consistent across retries and failures.
- Apply encryption, tenant isolation, retention, legal hold, deletion, export, backup, restoration, schema migration, integrity verification, and capacity controls.
- Define and test data minimization so audit, telemetry, and evidence stores do not duplicate credentials, keys, sensitive payloads, or personal data unnecessarily.

**Exit evidence:** Migration, corruption, contention, failover, backup, timed restore, retention, deletion, legal-hold, and load-test results against approved production-class technology.

### 5. Security, keys, policy, and privacy engineering

- Implement managed KMS/HSM adapters for authorization and receipt signing with generation, access, rotation, overlap, revocation, recovery, compromise, and retirement procedures.
- Complete architecture and data-flow diagrams, abuse cases, threat model, secure configuration, dependency controls, secret scanning, vulnerability handling, penetration-test remediation, and security regression coverage.
- Complete selective-disclosure design or explicitly scope and approve its deferral; verify that disclosed claims and stored evidence are minimized for each workflow.
- Implement controlled policy authoring, independent approval, signing, publication, activation, revocation, rollback, expiry, and compatibility checks without weakening default-deny or self-approval protections.

**Exit evidence:** Independent protocol and application security findings addressed or formally dispositioned, exercised key lifecycle, security test report, privacy-engineering review, and policy lifecycle demonstration.

### 6. Responsive, accessible, and inclusive service quality

- Design and test every workflow for mobile, tablet, desktop, and widescreen layouts. Forms, tables, queues, dialogs, evidence views, and navigation must reflow without clipped text, incoherent overlap, hidden actions, or horizontal page scrolling.
- Mobile layouts must support 320 CSS px and wider, touch and screen-reader operation, single-column forms, usable virtual-keyboard behavior, and compact case summaries without losing actions or status context. The input-method radio group and optional JSON textarea must remain labelled, operable, and visible without horizontal page scrolling.
- Tablet layouts must cover portrait and landscape operation, touch targets, split or stacked views as space permits, and rotation without lost state or obstructed controls.
- Desktop and widescreen layouts must constrain reading and form widths, use available space for useful queue/detail views, preserve clear focus order, and avoid sparse stretched content. Test common desktop widths through at least 1920 CSS px and representative browser zoom/reflow up to 400%.
- Support keyboard-only use, visible focus, semantic structure, screen readers, speech input where applicable, reduced motion, contrast, localization expansion, accessible errors, low bandwidth, interrupted networks, and accessible documents.

**Exit evidence:** Automated viewport regression checks and browser screenshots at representative 320, 375, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths; real-device or equivalent mobile/tablet tests in portrait and landscape; browser matrix; keyboard and assistive-technology results; no critical accessibility or responsive-layout defects.

### 7. Operations, observability, and resilience

- Implement centralized redacted logs, metrics, traces, dashboards, alerting, dependency health, audit-integrity monitoring, queue and storage signals, clock monitoring, and safe operational correlation identifiers.
- Define service indicators and candidate objectives, support boundaries, on-call roles, incident severity, escalation, runbooks, maintenance, capacity, change, rollback, and emergency shutdown procedures.
- Exercise dependency loss, identity and signer failure, unsafe policy activation, audit corruption, backlog, storage exhaustion, regional loss, restore, rollback, and monitoring loss while preserving fail-closed admission.
- Add privacy-preserving operational and outcome measures for errors, quality, disparity, timeliness, appeals, overrides, remedies, and service-channel performance.

**Exit evidence:** Production-like soak and capacity tests, alert demonstrations, completed incident/restore/rollback/shutdown exercises, measured recovery results, and reviewed runbooks.

### 8. Release, administration, and support readiness

- Provide institution-managed administration for users and roles, workflow configuration, approved reference data, policy versions, notices, languages, service contacts, retention, and reporting without exposing unrestricted technical configuration.
- Complete CI/CD gates for syntax, tests, schemas, accessibility regression, responsive screenshots, secret and dependency scans, artifact scanning, SBOM, checksums, provenance, signed release approval, deployment verification, migration, and rollback.
- Create operator, reviewer, administrator, support, records, security, and release documentation with training scenarios and evidence-handling procedures.

**Exit evidence:** Reproducible signed release candidate, protected approval workflow, verified rollback artifact, complete operational documentation, and no unresolved release-blocking finding.

## Phase 1 Exit Gate

Phase 1 is complete only when all Phase 1 workstreams have traceable evidence, required engineering and security reviews are complete, production-class integrations pass in a staging environment, and no critical defect or unowned high risk remains.

**Phase 1 exit status: PRODUCTION_READY_CANDIDATE — synthetic/staging use only**

## Phase 2: Move to Live

### Objective

Configure, assess, approve, and launch one named institutional deployment using the Phase 1 release candidate. This phase supplies the jurisdiction, accountable authorities, service channels, operating objectives, and external assurance that a repository cannot provide.

### 1. Institutional scope and service design

- Name the controller, service owner, users, affected groups, jurisdiction, purposes, prohibited uses, legal authority, decision makers, oversight body, records owner, support channels, shutdown authority, and risk acceptor.
- Approve the deployment boundary, data flows, languages, notices, forms, reason codes, deadlines, escalation levels, correction, objection, human review, appeal, remedy, complaint, and non-digital service routes.
- Configure roles, assignments, reference data, templates, retention, integrations, and workflow rules for the institution. Train and assess operators, reviewers, approvers, support staff, administrators, incident responders, and alternates.

**Exit evidence:** Approved service design and deployment charter, named accountable roles, operating procedures, training records, and signed jurisdictional policy requirements.

### 2. Environment, sovereignty, and integration commissioning

- Procure and configure approved regions, networks, ingress, domains, certificates, identity provider, KMS/HSM, database, queue, object storage, backup, monitoring, notification, document, and support integrations.
- Verify data, metadata, logs, backups, keys, administrators, subprocessors, support access, and recovery paths against residency, transfer, contractual, procurement, and exit requirements.
- Create isolated development, test, staging, and production environments with separate identities, keys, policies, data, networks, and evidence. Migrate only approved configuration and data through controlled procedures.

**Exit evidence:** Environment inventory, sovereignty and supplier evidence, access review, network and configuration review, key ceremony, integration acceptance, and tested migration/rollback plan.

### 3. Institution-specific assurance and acceptance

- Complete independent security, privacy, data-protection, legal, records, accessibility, human-rights, fairness, localization, browser/device, and operational assessments against the configured deployment.
- Remediate findings, retest controls, document justified exceptions, assign every residual risk an owner and expiry, and obtain acceptance only from authorities with delegated power.
- Validate the institution's signed policy pack and authorization issuer independently, including prohibited purposes, conflict rules, notices, review rights, revocation, rollback, and emergency suspension.

**Exit evidence:** Current independent reports, remediation and retest records, approved policy pack, completed risk register, and named approvals for every applicable production-assurance gate.

### 4. Responsive and accessible deployment acceptance

- Repeat complete journeys using the institution's real content, supported languages, identity provider, notices, forms, tables, documents, status routes, and manual-service information across supported mobile, tablet, desktop, and widescreen combinations.
- Test representative physical phones and tablets in portrait and landscape, supported desktop browsers through widescreen displays, 200% and 400% zoom/reflow, touch, keyboard, screen readers, speech input where required, low bandwidth, interruption, session expiry, and localization expansion.
- Confirm that no breakpoint hides decisions, evidence, validation, appeal routes, urgent contacts, or submission controls, and that dense operator queues remain usable without relying on a specific screen size.

**Exit evidence:** Institution-approved browser/device support matrix, independent accessibility report, responsive screenshot and real-device evidence, localization sign-off, remediated findings, and published accessible digital and non-digital service paths.

### 5. Operational acceptance and controlled launch

- Approve measurable SLOs, service hours, support and escalation targets, RTO/RPO, capacity envelope, alert thresholds, on-call rota, incident communications, maintenance, release, rollback, backup, restoration, shutdown, and decommissioning procedures.
- Run production-like load, failover, restore, incident, policy rollback, key compromise, evidence export, manual-service continuity, and emergency shutdown exercises with named participants and measured outcomes.
- Deploy the exact approved artifact, verify provenance and configuration, perform smoke and synthetic transactions, reconcile audit and receipts, and obtain explicit go-live authorization before enabling real users or data.
- Launch through a bounded pilot or phased rollout with entry, pause, rollback, and expansion criteria. Monitor technical, service, accessibility, rights, fairness, appeal, override, remedy, and support outcomes with daily early-life review.

**Exit evidence:** Signed operational acceptance, successful exercises, production verification record, explicit go-live decision, pilot plan, staffed support, and tested rollback trigger.

### 6. Live-service governance

- Review access, keys, suppliers, policy, risks, vulnerabilities, accessibility, service performance, outcomes, appeals, overrides, incidents, backups, restores, and capacity at approved cadences.
- Reassess after material code, model, policy, law, supplier, data, workflow, jurisdiction, or threat changes. Expired evidence or approval returns the affected capability to a disabled state.
- Preserve auditable release, decision, incident, remedy, and decommissioning evidence while applying approved retention, legal hold, deletion, and transparency requirements.

**Exit evidence:** Scheduled governance calendar, named owners, operational reporting, reassessment triggers, and exercised suspension and decommissioning controls.

## Phase 2 Exit Gate

The deployment may become **LIVE** only when every applicable production-assurance gate has current evidence and named approval, the exact production artifact and configuration have passed deployment verification, support and manual-service channels are active, residual risk is formally accepted, and an authorized institutional decision explicitly permits real users and real data. Any missing, expired, disputed, or failed gate keeps the service disabled.