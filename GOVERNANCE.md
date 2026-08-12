# Project Governance

## Roles

| Role | Accountability |
|---|---|
| Project owners | Strategy, access, funding, final risk acceptance |
| Maintainers | Triage, reviews, releases, repository administration |
| Security lead | Threat review, vulnerabilities, key and incident policy |
| Privacy/compliance lead | Processing, DPIAs, legal-control interpretation, claims |
| Service owner | Availability, operations, recovery, production acceptance |
| Contributors | Scoped implementation, tests, documentation, disclosure |

Named assignments and alternates must be recorded privately where publishing identity/contact details is inappropriate. No individual should unilaterally author, approve, and deploy a high-risk security change.

## Private-source access

Source access remains private. Owners grant least privilege through named accounts, MFA, SSO where available, protected branches, environment separation, and quarterly access review. Repository administration, production secrets, signing keys, deployment identities, and audit evidence are separate privileges. Access is removed promptly when a role ends. Contractors and vendors receive time-bounded, scoped access and return or destroy copies at offboarding.

## Separation of duties

Development, security review, privacy/legal review, release approval, production operations, and emergency authorization are distinct duties. A change author cannot be its sole reviewer or release approver. High-impact policy, identity, cryptography, model, data, persistence, monitoring, and deployment changes require independent security and privacy review plus service-owner approval. Policy author, legal/rights approver, publisher, activator, and rollback authority must be separated according to risk.

## Public-sector accountability

Each deployment names an accountable authority, data owner, service owner, records owner, security lead, privacy/legal lead, and independent oversight contact. Procurement decisions record evaluation criteria, conflicts, vendor access, localization, exit, and audit rights. Personnel disclose conflicts and recuse themselves from affected decisions.

## Change, release, and emergency control

Material changes require an issue, impact/risk assessment, ADR where applicable, test evidence, migration/rollback plan, and approved pull request. Releases require engineering, security, privacy/legal, and service-owner sign-off according to risk. Break-glass access is time-limited, purpose-bound, separately approved where practicable, fully logged, reviewed within one business day, and revoked automatically. Emergency changes receive retrospective review and cannot bypass evidence preservation or incident reporting.

## People affected by decisions

Deployments must provide accessible notice, correction, objection, explanation, appeal, human review, remedy, status, and non-digital channels appropriate to the service and jurisdiction. Assign conflict-free authorized reviewers, prohibit self-review, record recusal/override reason codes and audit evidence, and distinguish model recommendations from accountable decisions. No receipt is used to deny a remedy. Oversight bodies may inspect evidence under lawful access controls, and public reporting should disclose aggregate use, errors, incidents, appeals, and remediation without exposing protected data.

## Audit and disclosure

Audit events are minimized, time-synchronized, tamper-evident, access-controlled, retained according to approved schedules and legal holds, and independently exportable. Security vulnerabilities use the private process in `SECURITY.md`; incident disclosure is coordinated by the incident commander with security, privacy/legal, affected institutions, and public-communications roles.

## Decisions

Routine implementation decisions occur in pull requests. Architecture, cryptography, identity, persistence, data use, vendors, and deployment changes require an ADR. Owners resolve unresolved strategic disputes after documented technical, security, and privacy input. Risk acceptance must name owner, scope, expiry, and compensating controls.

## Repository controls

Protect `main`; require pull requests, at least one qualified approval, resolved discussions, current branches, and successful checks. Require additional security/privacy review for relevant paths. Restrict administration and secret access, review permissions periodically, and prohibit force pushes and branch deletion on `main`.

## Transparency

Track user-visible changes in `CHANGELOG.md`, execution status in `PROJECT_STATUS.md`, and security disclosures through advisories. Governance changes themselves require review.