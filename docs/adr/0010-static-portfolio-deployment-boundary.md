# ADR-0010: Separate the static portfolio deployment from the Express application

Date: 2026-08-14

Status: Accepted

Decision owners: Project maintainers

## Context

BeyondBeams needs a publicly viewable portfolio presentation on a static Vercel deployment. The maintained browser application is coupled to protected Express authentication, CSRF, tenant authorization, policy, A2SPA-R, case, and audit routes. Deploying that shell without its security boundary would trigger failed authentication calls and could misrepresent protected workflows as available. Deploying the prototype API publicly would exceed the documented development-only assurance boundary.

## Decision

Create a separate `portfolio/` source artifact and generate `dist/portfolio/` for Vercel. The artifact is frontend-only, read-only, and uses invented presentation records. It contains no authentication control, form submission, credential entry, service worker, backend request, API client, function, or catch-all rewrite. Protected workflows are represented by explicitly labelled static views with disabled illustrative controls.

`vercel.json` deploys only `dist/portfolio`, applies restrictive response headers, and defines no rewrite. As a result, absent `/api/*`, `/auth/*`, `/audit/*`, and `/execute` resources remain unmatched static paths rather than resolving to portfolio HTML. The Express dashboard and server are not copied into the artifact and their existing authentication and authorization behavior is unchanged.

## Alternatives considered

- Deploy the existing dashboard alone and let authentication fail: rejected because it still makes backend requests, creates avoidable errors, and implies access might be available.
- Add a runtime flag to the existing dashboard: rejected because static and authenticated behavior would share a security-sensitive client bundle and increase regression risk.
- Deploy Express as Vercel functions: rejected because it would expose a development-only service without the production providers, operations, and assurance required by the project gate.
- Add a catch-all SPA rewrite: rejected because it could mask absent API and authentication routes with successful HTML responses.

## Consequences

The portfolio can explain the product and demonstrate responsive workflow design without creating a public operational surface. Static portfolio content must be maintained separately from the functional dashboard, and it is not evidence that protected workflows or production controls are available on Vercel.

## Security, privacy, and operations

The Content Security Policy sets `connect-src 'none'`, `form-action 'none'`, `frame-ancestors 'none'`, `font-src 'none'`, and `worker-src 'none'`. No secrets or environment-specific identifiers are required. The artifact collects no submitted data, includes no analytics, and loads no third-party frontend resources. Vercel still processes ordinary HTTP metadata under its deployment terms; operators must assess that service before presenting the artifact publicly.

## Validation and review date

Run `npm run build:portfolio`, syntax and JSON checks, the complete deterministic test suite, `npm run validate:portfolio:browser`, dependency audit, secret scan, artifact request checks, and `git diff --check`. The browser validator exercises explicit routes, responsive viewports, keyboard navigation, the accessibility tree, same-origin resources, and absent protected namespaces; it writes ignored screenshots and diagnostics under `artifacts/portfolio-browser/`. Review this decision before adding any network request, form, analytics, authentication, dynamic function, rewrite, or external integration to the portfolio.