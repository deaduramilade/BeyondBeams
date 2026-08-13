# Residual-Risk Register

**Status:** Open template; no risk acceptance recorded

**Owner:** To be assigned by deploying institution

**Last reviewed:** 2026-08-11

This register is intentionally incomplete. It must be completed, reviewed, and accepted by the institution responsible for a specific deployment. Repository maintainers must not fill in names, approvals, legal conclusions, or evidence that has not been supplied.

| ID | Risk / affected scope | Severity | Owner | Mitigation or justification | Evidence / finding | Due date | Expiry / review | Acceptance authority | Status |
|---|---|---|---|---|---|---|---|---|---|
| R-001 | A2SPA-R has no independent protocol/security assessment or production issuer/signer custody | Critical | To assign | Independent review, managed issuer/signer, rotation/revocation/recovery evidence | `ARCHITECTURE.md`, ADR-0003 | Unresolved | Unresolved | Named security/institutional authority | Open |
| R-002 | No jurisdiction, legal authority, retention, language, accessibility, or remedy requirements supplied | Critical | To assign | Complete approved deployment charter and policy pack; keep pilot synthetic-only | This request/context | Unresolved | Unresolved | Named institution/legal authority | Open |
| R-003 | No production key-management, revocation, recovery, or retirement evidence | Critical | To assign | Approved KMS/HSM lifecycle and exercised recovery | `SECURITY.md`, `PRODUCTION_ASSURANCE.md` | Unresolved | Unresolved | Named security/key authority | Open |
| R-004 | No institution-specific SLO, RTO, or RPO approval or measured evidence | High | To assign | Business-impact analysis, objective approval, restore and incident exercises | `DISASTER_RECOVERY.md`, `PRODUCTION_ASSURANCE.md` | Unresolved | Unresolved | Named service/operations authority | Open |
| R-005 | No independent security, privacy, legal, accessibility, or operational assessments | Critical | To assign | Commission assessments; remediate, justify, retest, and review residual risk | `COMPLIANCE.md` | Unresolved | Unresolved | Named institutional approval body | Open |
| R-006 | Durable audit, persistence, backup, and restore controls are not evidenced for production | High | To assign | Implement and test approved stores, integrity, retention, backup, and restoration | `ARCHITECTURE.md` | Unresolved | Unresolved | Named records/service authority | Open |
| R-007 | Institutional release approval and qualified vulnerability disposition are not complete for a release | High | To assign | Configure protected release approval; generate/verify retained evidence; block unresolved critical findings | `RELEASE_ASSURANCE.md` | Unresolved | Unresolved | Named release/security authority | Open |
| R-008 | Emergency shutdown/decommissioning has not been exercised | High | To assign | Tabletop and technical exercise; preserve evidence and verify safe closure | `PRODUCTION_ASSURANCE.md` | Unresolved | Unresolved | Named shutdown/records authority | Open |
| R-009 | Signed policy engine uses only synthetic packs; no jurisdictional mapping has independent validation | Critical | To assign | Institution-approved pack, qualified independent validation, findings/retest | `POLICY_PACKS.md`, ADR-0006 | Unresolved | Unresolved | Named legal/rights authority | Open |
| R-010 | File persistence and in-process metrics are single-host reference adapters | High | To assign | Regional database/queue/object/telemetry services, restore/load/alert evidence | `PERSISTENCE.md`, `OBSERVABILITY.md` | Unresolved | Unresolved | Named service/operations authority | Open |
| R-011 | No independently assessed accessible deployment, institutional manual service path, or governed review/appeal workflow | Critical | To assign | Complete qualified assessment and approved accessible review/remedy service design | `ACCESSIBILITY.md`, `CONSEQUENTIAL_ACTIONS.md` | Unresolved | Unresolved | Named accessibility/service/rights authority | Open |
| R-012 | Provider-neutral synthetic contracts may be mistaken for completed production integrations | Critical | To assign | Keep synthetic providers disconnected from runtime; require selected-provider contract and staging evidence plus named approval | ADR-0009, `docs/PRODUCTION_GAP_AUDIT.md` | Unresolved | Unresolved | Named service/security authority | Open |

## Acceptance record

- Deployment/institution: **UNRESOLVED**
- Jurisdiction and versioned policy pack: **UNRESOLVED**
- Residual-risk review date: **UNRESOLVED**
- Named institutional approver and authority: **UNRESOLVED**
- Explicit acceptance decision and scope: **NONE RECORDED**
- Expiry and reassessment trigger: **UNRESOLVED**
