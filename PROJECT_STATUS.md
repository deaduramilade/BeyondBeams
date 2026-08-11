# Project Status

**Phase:** Pre-production prototype

**Overall status:** Development only; not approved for production or real personal data

**Last reviewed:** 2026-08-11

**Integration branch:** `main`

## Completed

- Imported Copilot Studio unmanaged solution version 1.0.0.2.
- Implemented Express endpoint, browser/PWA dashboard, orchestrator, and five simulated domain agents.
- Implemented prototype EC signing/verification and development key generation.
- Removed hardcoded API credentials and LAN address; introduced runtime configuration.
- Established atomic Git history, feature-branch workflow, and initial documentation suite.
- Removed the discontinued native client and its dependency tree.
- Adopted a jurisdiction-neutral public-sector charter, private-source governance model, and A2SPA-R target profile.

## In progress

| Work | State | Exit condition |
|---|---|---|
| Documentation baseline | In review | Documentation PR approved and merged |
| Repository governance | Partial | GitHub branch protection and required checks enabled |
| Global policy-pack model | Design only | One independently reviewed jurisdictional implementation validated |
| A2SPA-R action receipts | Design only | Versioned schemas, verifier, nonce store, receipt ledger, and tests implemented |

## Immediate backlog

- [ ] Replace syntax-only `npm test` with a deterministic automated suite.
- [ ] Centralize duplicated A2SPA implementation and resolve JS/TS divergence.
- [ ] Design external authorization issuance and persisted nonce consumption.
- [ ] Add strict request/action schemas, payload limits, restricted CORS, rate limits, and safe errors.
- [ ] Add health/readiness, structured redacted audit events, monitoring, and graceful shutdown.
- [ ] Correct `.env.example` to represent required owner key variables safely.
- [ ] Resolve licensing conflict between `LICENSE.md` and `package.json`.
- [ ] Establish CI secret/dependency/code/Markdown scans and branch protection.
- [ ] Implement the A2SPA-R envelope, receipt, selective-disclosure, revocation, and verifier contracts.
- [ ] Add localization, WCAG-conformant accessibility testing, and low-bandwidth/non-digital service paths.

## Production blockers

- [ ] Approved architecture and threat model
- [ ] Independent security assessment and remediation
- [ ] Privacy impact assessment, processing inventory, and lawful-basis review
- [ ] Production secret/key lifecycle and access controls
- [ ] Durable audit, replay prevention, backup, restoration, incident, and operations capabilities
- [ ] Deployment platform, sovereignty evidence, SLOs, RTO/RPO, and accountable approvals

## Known risks

The service signs requests within the receiving process; static API keys lack scopes/expiry; nonces are not consumed; arbitrary payloads are accepted; logs may expose supplied data; CORS is unrestricted; tests are scripts rather than assertions; and compliance outcomes are simulated.

## Next recommended action

Build the automated security-focused test harness first, then refactor A2SPA behind those tests. Every status update should cite a pull request or commit and move completed work into the dated update history.

## Update history

| Date | Change |
|---|---|
| 2026-08-11 | Established audited repository and documentation baseline |