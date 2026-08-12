# Dependency Management

## Inventory

The service uses Express and CORS. JSON parsing uses Express's built-in bounded parser; `body-parser` is transitive through Express and pinned through the root `package-lock.json`. The PWA uses browser platform capabilities and has no separate package manifest.

## Policy

- Commit manifests and lockfiles together; use `npm ci` in automation.
- Add a package only for a demonstrated need after checking maintenance, license, provenance, advisories, install scripts, and transitive impact.
- Prefer platform capabilities and existing packages over overlapping dependencies.
- Pin deployable artifacts and generate an SBOM for releases.
- CI generates a CycloneDX dependency SBOM and retains it as a short-lived build artifact. The protected release workflow additionally attaches the packed artifact, SBOM, dependency-audit JSON, SHA-256 checksums, build metadata, and GitHub provenance attestation. A production release still requires a qualified vulnerability disposition record.
- Review automated update pull requests with normal tests; never auto-merge major or security-sensitive updates without assessment.

## Vulnerabilities

The Phase 2 lockfile update resolves the previously reported body-parser and qs advisories. `npm audit --audit-level=low` must remain clean in CI. Triage future findings by exploitability and exposure rather than suppressing blindly. Critical/high findings require remediation or documented, expiring risk acceptance before release.

## Removal and review

Remove unused packages and update lockfiles. Review direct dependencies at least quarterly and before major releases. Record material dependency choices in an ADR when they create architectural or security lock-in.