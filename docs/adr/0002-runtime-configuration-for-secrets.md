# ADR-0002: Supply secrets through runtime configuration

Date: 2026-08-11

Status: Accepted

Decision owners: Project maintainers

## Context

Initial prototype clients and server contained hardcoded API values. Public source control makes embedded credentials immediately unsuitable.

## Decision

Supply server API keys and A2SPA key material at runtime. Ignore local environment files, publish placeholders only, and treat Expo public configuration as non-secret.

## Consequences

Deployments require an external secret source and rotation process. The current environment-variable mechanism is acceptable for controlled development but production should adopt managed secrets and, where justified, managed signing hardware. No secret value belongs in examples, logs, issues, or client bundles.