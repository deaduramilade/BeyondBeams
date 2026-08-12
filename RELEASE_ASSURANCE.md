# Release Assurance

**Status:** Repository automation implemented; production release approval not recorded

## Automated evidence

An authorized maintainer dispatches `.github/workflows/release-evidence.yml` with an existing reviewed tag. After protected `release` environment approval, the job checks out and verifies that tag, performs a clean install, syntax checks, deterministic tests, and dependency audit; creates a packed source artifact, CycloneDX SBOM, audit JSON, build metadata, and SHA-256 checksum manifest; requests a GitHub build-provenance attestation for the package; and creates the GitHub release with the evidence attached. Release attachments remain with the release unless an authorized repository administrator deletes them; the workflow artifact is an additional 90-day copy.

No credentials or private keys are included. The package follows npm ignore rules and must be inspected before the first release and whenever packaging boundaries change.

## Required repository settings and approvals

Protect the `release` GitHub environment with named reviewers who did not author the release change. Protect `main`, require CI and qualified code review, restrict release creation and deletion, retain audit logs, and require signed tags where approved signing infrastructure exists. The release record must link scope, change approval, security/privacy/service-owner approvals, test evidence, migration and rollback plan, compatible configuration/policy versions, and the previous verified artifact.

`npm-audit.json` is scanner output, not a vulnerability disposition. A qualified security reviewer must record each applicable finding, exposure, owner, decision, remediation or expiring acceptance, and retest before approving the environment. Container, image, infrastructure, and deployment-artifact scanning becomes mandatory when those artifacts are introduced.

## Verification and rollback

Consumers verify the tag/commit, GitHub attestation, `SHA256SUMS`, SBOM, audit record, and release approvals before promotion. Promote the identical digest through staging and production. On rollback, stop promotion or drain ingress, select the last approved compatible artifact and policy/configuration set, verify its evidence, redeploy, run authorization/readiness/audit checks, and record trigger, authority, versions, outcome, and follow-up. A GitHub release is not production approval by itself.