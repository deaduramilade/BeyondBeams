# Dependency Management

## Inventory

The service uses Express, CORS, and body-parser. Its exact transitive dependency graph is preserved in the root `package-lock.json`. The PWA uses browser platform capabilities and has no separate package manifest.

## Policy

- Commit manifests and lockfiles together; use `npm ci` in automation.
- Add a package only for a demonstrated need after checking maintenance, license, provenance, advisories, install scripts, and transitive impact.
- Prefer platform capabilities and existing packages over overlapping dependencies.
- Pin deployable artifacts and generate an SBOM for releases.
- Review automated update pull requests with normal tests; never auto-merge major or security-sensitive updates without assessment.

## Vulnerabilities

Run audit and repository security tooling for the package root. Triage exploitability and exposure rather than suppressing blindly. Critical/high findings require remediation or documented, expiring risk acceptance before release. Rotate credentials if compromise may have executed package code.

## Removal and review

Remove unused packages and update lockfiles. Review direct dependencies at least quarterly and before major releases. Record material dependency choices in an ADR when they create architectural or security lock-in.