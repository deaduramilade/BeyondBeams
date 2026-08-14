# BeyondBeams

BeyondBeams is an early-stage sovereign AI authorization and accountability fabric for governments and public institutions worldwide. It combines a Node.js API, an installable responsive web dashboard, five domain-agent prototypes, and an experimental Agent-to-Secure Payload Authorization (A2SPA) mechanism. Its proposed differentiator is A2SPA-R: privacy-preserving, verifiable action envelopes and receipts for consequential AI-assisted actions.

> **Maturity notice:** This repository is a prototype. It is not independently audited, certified, or approved for production or real personal data. Each deploying jurisdiction must complete its own legal, procurement, privacy, accessibility, records, security, and sovereignty assessment. See [Project Status](PROJECT_STATUS.md), [Security](SECURITY.md), and [Compliance](COMPLIANCE.md).

## Repository map

| Path | Responsibility |
|---|---|
| `server.js` | Express API and static dashboard host |
| `src/BeyondBeams.js` | Action-prefix router and central orchestrator |
| `src/a2spa-r/` | Canonical authorization envelopes, receipts, trust, and replay |
| `src/policy/` | Signed policy-pack verification and authorization decisions |
| `src/audit/`, `src/persistence/`, `src/operations/` | Development audit, queue, and metrics adapters |
| `dashboard/` | Responsive browser/PWA client with localized accessible development controls |
| `portfolio/` | Isolated frontend-only source for the read-only Vercel portfolio artifact |
| `BeyondBeams_1_0_0_2/` | Unmanaged Copilot Studio solution export |
| `docs/adr/` | Architecture decision records |

## Quick start

Prerequisites are Node.js, npm, Git, and a modern browser. GitHub Codespaces may be used as a development environment; it is not application hosting. A production deployment must use an approved sovereign or jurisdictionally acceptable platform, such as a government-controlled Azure region where contractually appropriate.

```bash
npm ci
npm start
```

The development-only launcher generates ephemeral keys in memory, writes non-key state under ignored `runtime-data/`, binds only to loopback, and leaves protected workflows unavailable until a real identity provider is configured. The default URL is `http://127.0.0.1:3000`.

## Read-only portfolio build

The repository also contains a separate frontend-only portfolio presentation for static Vercel hosting. It does not include the Express server, make backend requests, authenticate users, accept data, execute agents, or claim that protected workflows are operational.

```bash
npm run build:portfolio
npm run preview:portfolio
npm run validate:portfolio:browser
```

The generated artifact is written to ignored `dist/portfolio/`. The preview binds to loopback and serves only that artifact. Browser validation uses an installed Microsoft Edge, Google Chrome, or Chromium (or `PORTFOLIO_BROWSER_PATH`) to exercise explicit routes, responsive layouts, keyboard controls, accessibility structure, local-only network behavior, and absent backend namespaces; screenshots and a machine-readable report are written to ignored `artifacts/portfolio-browser/`.

`vercel.json` deploys only `dist/portfolio/` and intentionally defines no SPA catch-all rewrite, so absent `/api/*`, `/auth/*`, `/audit/*`, and `/execute` paths are not masked by portfolio HTML. This static presentation does not change or replace the normal Express-hosted application. See [ADR-0010](docs/adr/0010-static-portfolio-deployment-boundary.md).

For configured integration testing, inject OIDC/JWKS identity, A2SPA-R issuer public keys, signed policy packs, ignored local replay/audit directories, and a development receipt signer, then run `node server.js`. See [Configuration](CONFIGURATION.md).

## Action families

| Prefix | Agent |
|---|---|
| `realtime.defense.` | Real-Time Defense |
| `compliance.automation.` | Compliance Automation |
| `predictive.analytics.` | Predictive Analytics |
| `regulatory.oversight.` | Regulatory Oversight |
| `rights.management.` | Rights Management |

## Documentation

Start with [Development](DEVELOPMENT.md), [Architecture](ARCHITECTURE.md), [Policy Packs](POLICY_PACKS.md), [Accessibility and Service Inclusion](ACCESSIBILITY.md), [Consequential-Action Safeguards](CONSEQUENTIAL_ACTIONS.md), [Release Assurance](RELEASE_ASSURANCE.md), [Persistence](PERSISTENCE.md), and [Observability](OBSERVABILITY.md). Project-level [privacy](docs/legal/PRIVACY_NOTICE.md), [cookie](docs/legal/COOKIE_NOTICE.md), and [terms](docs/legal/TERMS_AND_CONDITIONS.md) baselines are published in the application and require operator identity, jurisdiction-specific counsel, and the [legal publication checklist](docs/legal/DEPLOYMENT_LEGAL_CHECKLIST.md) before live use. Remaining work is divided into Production Ready and Move to Live phases in [Production Readiness and Live-Service Roadmap](PRODUCTION_ROADMAP.md). Assurance and residual risks are in [Production Assurance](PRODUCTION_ASSURANCE.md), [Risk Register](RISK_REGISTER.md), and [Project Status](PROJECT_STATUS.md). No production approval is recorded.

## License and status

No open-source license is currently granted. See [License](LICENSE.md). The private package metadata is marked `UNLICENSED` to match that status.
