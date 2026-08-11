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

## Decisions

Routine implementation decisions occur in pull requests. Architecture, cryptography, identity, persistence, data use, vendors, and deployment changes require an ADR. Owners resolve unresolved strategic disputes after documented technical, security, and privacy input. Risk acceptance must name owner, scope, expiry, and compensating controls.

## Repository controls

Protect `main`; require pull requests, at least one qualified approval, resolved discussions, current branches, and successful checks. Require additional security/privacy review for relevant paths. Restrict administration and secret access, review permissions periodically, and prohibit force pushes and branch deletion on `main`.

## Transparency

Track user-visible changes in `CHANGELOG.md`, execution status in `PROJECT_STATUS.md`, and security disclosures through advisories. Governance changes themselves require review.