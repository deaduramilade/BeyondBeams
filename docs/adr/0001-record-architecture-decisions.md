# ADR-0001: Record consequential architecture decisions

Date: 2026-08-11  
Status: Accepted  
Decision owners: Project maintainers

## Context

The project spans cryptography, privacy, government workflows, multiple clients, and exported platform assets. Code alone cannot preserve alternatives, risk acceptance, or intended boundaries.

## Decision

Use Markdown ADRs under `docs/adr/` for consequential decisions. Accepted records remain immutable and are superseded rather than rewritten.

## Consequences

Pull requests may require an ADR before implementation. This adds review effort but improves auditability, onboarding, and risk decisions. `DECISIONS.md` is the index.