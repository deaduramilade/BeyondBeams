# Architecture Decisions

Architecture Decision Records (ADRs) preserve why consequential choices were made and prevent decisions from being inferred from code alone.

| ADR | Status | Summary |
|---|---|---|
| [0001](docs/adr/0001-record-architecture-decisions.md) | Accepted | Use ADRs for consequential decisions |
| [0002](docs/adr/0002-runtime-configuration-for-secrets.md) | Accepted | Keep credentials out of source control |
| [0003](docs/adr/0003-current-a2spa-prototype.md) | Provisional | Document current A2SPA mechanics and limits |
| [0004](docs/adr/0004-replace-native-client-with-pwa.md) | Accepted | Replace the separate native client with a responsive PWA |
| [0005](docs/adr/0005-production-assurance-and-governance-gate.md) | Proposed | Require evidence-based production assurance and institutional acceptance |
| [0006](docs/adr/0006-policy-persistence-and-observability-boundaries.md) | Proposed | Separate governed policy and production service adapters |
| [0007](docs/adr/0007-accessible-governed-actions-and-release-evidence.md) | Proposed | Establish accessible governed-action and release-evidence baselines |

Create ADRs for changes to cryptography, identity, authorization, persistence, external vendors, data processing, deployment topology, and public contracts. Accepted ADRs are immutable; supersede them with a new record.