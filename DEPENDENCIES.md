# Dependency Management

## Inventory

The root service uses Express, CORS, and body-parser. The mobile app uses Expo, React, React Native, axios, and expo-status-bar. Exact transitive graphs are preserved in root and mobile `package-lock.json` files.

## Policy

- Commit manifests and lockfiles together; use `npm ci` in automation.
- Add a package only for a demonstrated need after checking maintenance, license, provenance, advisories, install scripts, and transitive impact.
- Prefer platform capabilities and existing packages over overlapping dependencies.
- Pin deployable artifacts and generate an SBOM for releases.
- Review automated update pull requests with normal tests; never auto-merge major or security-sensitive updates without assessment.

## Vulnerabilities

Run audit and repository security tooling for both package roots. Triage exploitability and exposure rather than suppressing blindly. Critical/high findings require remediation or documented, expiring risk acceptance before release. Rotate credentials if compromise may have executed package code.

## Removal and review

Remove unused packages and update lockfiles. Review direct dependencies at least quarterly and before major releases. Record material dependency choices in an ADR when they create architectural or security lock-in.