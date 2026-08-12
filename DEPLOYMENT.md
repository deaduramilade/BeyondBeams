# Deployment Guide

## Status

No production deployment target or automated pipeline is committed. The current server is suitable only for controlled development evaluation.

The GitHub Student Developer Pack can support learning and development: Codespaces supplies metered development environments, and the listed Microsoft Azure offer may support a time-limited development deployment subject to the user's current eligibility and offer terms. Neither is selected as the production platform. GitHub Pages can host static PWA assets but cannot execute this Express API. Every government deployment must select regions, operators, keys, support access, contracts, exit plans, and cross-border safeguards through its own procurement and sovereignty review.

## Required architecture

Deploy the PWA and immutable pinned API artifact behind TLS ingress and a web application firewall. Run the API non-root on a read-only filesystem, bind internally, restrict egress, inject secrets from a vault, centralize redacted telemetry, and expose restricted probes. Separate environments, credentials, networks, data, publisher/issuer/receipt keys, policy packs, replay/audit/queue/object stores, backups, and monitoring. Apply `PERSISTENCE.md` and `OBSERVABILITY.md` without changing receipt semantics.

## Promotion process

1. Merge an approved pull request with passing security and quality gates.
2. Build once from a tagged commit; produce and verify the retained SBOM, artifact digest, dependency-audit disposition, metadata, and provenance evidence described in `RELEASE_ASSURANCE.md`.
3. Scan dependencies and artifact; block unresolved critical findings.
4. Deploy to staging with synthetic data and staging-only keys.
5. Run smoke, contract, authorization, rollback, and observability checks.
6. Obtain engineering, security, privacy, and service-owner approvals.
7. Promote the same artifact to production and record evidence.

## Configuration and keys

Never bake keys into artifacts. Use separate API and A2SPA keys per environment, define owners and expiry, stage rotations with overlapping verification keys, revoke compromised material, and test recovery. Client builds may contain only non-privileged credentials.

## Rollback

Retain the last verified artifact and compatible configuration. Roll back on authentication failure, elevated errors, integrity concerns, or monitoring loss. Do not roll back data schemas without a tested compatibility plan. Record trigger, decision maker, artifact versions, and post-rollback checks.

## Release verification

Confirm TLS, CORS, safe output, least privilege, secret injection, OIDC/JWKS, authorization and policy trust/revocation, managed signing, replay/audit/queue/object durability, telemetry, clock health, alerts, backups/timed restore, load results, runbook access, and approved data locations. Production remains blocked while `SECURITY.md` and `PROJECT_STATUS.md` controls are open.