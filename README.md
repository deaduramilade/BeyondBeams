# Oblivion-AI

Oblivion-AI is an early-stage sovereign AI authorization and accountability fabric for governments and public institutions worldwide. It combines a Node.js API, an installable responsive web dashboard, five domain-agent prototypes, and an experimental Agent-to-Secure Payload Authorization (A2SPA) mechanism. Its proposed differentiator is A2SPA-R: privacy-preserving, verifiable action envelopes and receipts for consequential AI-assisted actions.

> **Maturity notice:** This repository is a prototype. It is not independently audited, certified, or approved for production or real personal data. Each deploying jurisdiction must complete its own legal, procurement, privacy, accessibility, records, security, and sovereignty assessment. See [Project Status](PROJECT_STATUS.md), [Security](SECURITY.md), and [Compliance](COMPLIANCE.md).

## Repository map

| Path | Responsibility |
|---|---|
| `server.js` | Express API and static dashboard host |
| `src/OblivionAI.js` | Action-prefix router and central orchestrator |
| `src/a2spa-crypto/` | Domain agents, A2SPA prototypes, key utility, and scripts |
| `dashboard/` | Browser client |
| `dashboard/` | Responsive browser/PWA client |
| `Oblivion_1_0_0_2/` | Unmanaged Copilot Studio solution export |
| `docs/adr/` | Architecture decision records |

## Quick start

Prerequisites are Node.js, npm, Git, and a modern browser. GitHub Codespaces may be used as a development environment; it is not application hosting. A production deployment must use an approved sovereign or jurisdictionally acceptable platform, such as a government-controlled Azure region where contractually appropriate.

```bash
 npm ci
node src/a2spa-crypto/keygen.js
node server.js
```

Set `OWNER_PRIVATE_KEY`, `OWNER_PUBLIC_KEY`, and `API_KEYS` in the process environment before starting the service. See [Configuration](CONFIGURATION.md). The default URL is `http://127.0.0.1:3000`.

## Action families

| Prefix | Agent |
|---|---|
| `realtime.defense.` | Real-Time Defense |
| `compliance.automation.` | Compliance Automation |
| `predictive.analytics.` | Predictive Analytics |
| `regulatory.oversight.` | Regulatory Oversight |
| `rights.management.` | Rights Management |

## Documentation

Start with [Development](DEVELOPMENT.md), [Architecture](ARCHITECTURE.md), [Agents](AGENTS.md), and [Contributing](CONTRIBUTING.md). Operational and assurance documents are indexed in [Project Status](PROJECT_STATUS.md).

## License and status

No open-source license is currently granted. See [License](LICENSE.md). The maintainers must resolve the conflicting `ISC` package metadata before third-party use or distribution.
