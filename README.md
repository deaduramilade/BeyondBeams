# Oblivion-AI

Oblivion-AI is an early-stage sovereign AI authorization and accountability fabric for governments and public institutions worldwide. It combines a Node.js API, an installable responsive web dashboard, five domain-agent prototypes, and an experimental Agent-to-Secure Payload Authorization (A2SPA) mechanism. Its proposed differentiator is A2SPA-R: privacy-preserving, verifiable action envelopes and receipts for consequential AI-assisted actions.

> **Maturity notice:** This repository is a prototype. It is not independently audited, certified, or approved for production or real personal data. Each deploying jurisdiction must complete its own legal, procurement, privacy, accessibility, records, security, and sovereignty assessment. See [Project Status](PROJECT_STATUS.md), [Security](SECURITY.md), and [Compliance](COMPLIANCE.md).

## Repository map

| Path | Responsibility |
|---|---|
| `server.js` | Express API and static dashboard host |
| `src/OblivionAI.js` | Action-prefix router and central orchestrator |
| `src/a2spa-r/` | Canonical authorization envelopes, receipts, trust, and replay |
| `src/policy/` | Signed policy-pack verification and authorization decisions |
| `src/audit/`, `src/persistence/`, `src/operations/` | Development audit, queue, and metrics adapters |
| `dashboard/` | Responsive browser/PWA client with localized accessible development controls |
| `Oblivion_1_0_0_2/` | Unmanaged Copilot Studio solution export |
| `docs/adr/` | Architecture decision records |

## Quick start

Prerequisites are Node.js, npm, Git, and a modern browser. GitHub Codespaces may be used as a development environment; it is not application hosting. A production deployment must use an approved sovereign or jurisdictionally acceptable platform, such as a government-controlled Azure region where contractually appropriate.

```bash
 npm ci
node src/a2spa-crypto/keygen.js
node server.js
```

Configure OIDC/JWKS identity, A2SPA-R issuer public keys, signed policy packs, ignored local replay/audit directories, and a development receipt signer before starting. See [Configuration](CONFIGURATION.md). The default URL is `http://127.0.0.1:3000`.

## Action families

| Prefix | Agent |
|---|---|
| `realtime.defense.` | Real-Time Defense |
| `compliance.automation.` | Compliance Automation |
| `predictive.analytics.` | Predictive Analytics |
| `regulatory.oversight.` | Regulatory Oversight |
| `rights.management.` | Rights Management |

## Documentation

Start with [Development](DEVELOPMENT.md), [Architecture](ARCHITECTURE.md), [Policy Packs](POLICY_PACKS.md), [Accessibility and Service Inclusion](ACCESSIBILITY.md), [Consequential-Action Safeguards](CONSEQUENTIAL_ACTIONS.md), [Release Assurance](RELEASE_ASSURANCE.md), [Persistence](PERSISTENCE.md), and [Observability](OBSERVABILITY.md). Remaining work is divided into Production Ready and Move to Live phases in [Production Readiness and Live-Service Roadmap](PRODUCTION_ROADMAP.md). Assurance and residual risks are in [Production Assurance](PRODUCTION_ASSURANCE.md), [Risk Register](RISK_REGISTER.md), and [Project Status](PROJECT_STATUS.md). No production approval is recorded.

## License and status

No open-source license is currently granted. See [License](LICENSE.md). The private package metadata is marked `UNLICENSED` to match that status.
