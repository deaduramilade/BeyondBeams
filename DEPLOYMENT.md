# Deployment Guide

## Status

No production deployment target or automated pipeline is committed. The current server is suitable only for controlled development evaluation.

A separate `portfolio/` source and `npm run build:portfolio` artifact may be deployed to Vercel for public, read-only portfolio presentation. It contains no Express runtime or protected operation and is not an application deployment, staging environment, production target, or assurance evidence. Vercel serves only `dist/portfolio`; no catch-all rewrite is configured, and API/authentication paths must remain absent. See ADR-0010.

Configure the Vercel project root as the repository root and retain the committed `framework: null` (Vercel's `Other` preset), `buildCommand`, `outputDirectory`, and response headers in `vercel.json`. The explicit framework override prevents the repository's Express package metadata from being selected for this static deployment. The portfolio requires no runtime environment variables, secrets, functions, data stores, analytics, or external frontend resources. Do not override the output directory with the Express application or add a rewrite to it.

Before creating a Vercel preview, run `npm run check`, `npm run validate:json`, `npm test`, `npm run build:portfolio`, `npm run validate:portfolio:browser`, `npm audit --audit-level=low`, `npm run scan:secrets`, and `git diff --check`. The browser validator requires an installed Microsoft Edge, Google Chrome, or Chromium; set `PORTFOLIO_BROWSER_PATH` when it is not in a standard location. Review the generated `artifacts/portfolio-browser/report.json` and viewport screenshots, verify `/api/*`, `/auth/*`, `/audit/*`, and `/execute` remain absent, and confirm the diff includes no unintended changes under `server.js`, `src/`, or `dashboard/`. Deployment still occurs only through a reviewed pull request; this repository does not commit or invoke a Vercel deployment command.

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
