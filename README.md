# Oblivion-AI

Oblivion-AI is an early-stage sovereign agent orchestration prototype focused on Nigerian public-sector privacy, security, and regulatory workflows. It combines a Node.js API, browser dashboard, Expo mobile client, five domain agents, an experimental Agent-to-Secure Payload Authorization (A2SPA) mechanism, and an unmanaged Microsoft Copilot Studio solution export.

> **Maturity notice:** This repository is a prototype. It has not been independently audited, certified, or demonstrated to satisfy the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data Protection Regulation (NDPR), or production security requirements. See [Project Status](PROJECT_STATUS.md), [Security](SECURITY.md), and [Compliance](COMPLIANCE.md).

## Repository map

| Path | Responsibility |
|---|---|
| `server.js` | Express API and static dashboard host |
| `src/OblivionAI.js` | Action-prefix router and central orchestrator |
| `src/a2spa-crypto/` | Domain agents, A2SPA prototypes, key utility, and scripts |
| `dashboard/` | Browser client |
| `mobile/` | Expo/React Native client |
| `Oblivion_1_0_0_2/` | Unmanaged Copilot Studio solution export |
| `docs/adr/` | Architecture decision records |

## Quick start

Prerequisites are Node.js, npm, Git, and, for mobile development, the Expo toolchain supported by Expo SDK 54.

```bash
npm ci
cd mobile && npm ci && cd ..
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
