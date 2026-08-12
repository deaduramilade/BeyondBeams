# Release Process

## Versioning

Adopt Semantic Versioning once a stable contract exists. Until then, use `0.x` prereleases; the current manifest version `1.0.0` does not constitute production-readiness evidence. Align the root service, PWA, Copilot solution, and release notes deliberately rather than assuming one shared lifecycle.

## Release checklist

1. Define scope and compatibility impact.
2. Resolve release-blocking status, security, privacy, compliance, and operational items.
3. Pass automated tests, scans, review, and staging verification.
4. Update version metadata and `CHANGELOG.md` in a release pull request.
5. Obtain accountable approvals and merge to protected `main`.
6. Create a signed annotated tag where signing infrastructure exists.
7. Dispatch the protected release-evidence workflow for the reviewed tag. It verifies the tag and creates the GitHub release with the package, SBOM, audit output, checksums, metadata, and provenance attestation; verify them before promotion.
8. Deploy according to `DEPLOYMENT.md`, monitor, and record evidence.

## Hotfixes and deprecation

Hotfixes still require a branch, focused review, tests, and changelog entry; emergency approvals must be retrospective and documented. Announce deprecations with replacement, migration, and removal timeline. Never silently change action contracts or cryptographic envelope formats.

See [Release Assurance](RELEASE_ASSURANCE.md) for environment protection, finding disposition, verification, evidence retention, and rollback requirements.