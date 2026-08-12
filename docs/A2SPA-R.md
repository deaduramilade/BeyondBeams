# A2SPA-R Action Envelope and Receipt Profile

**Status:** Development profile implemented; independent review and production adapters outstanding

## Authorization envelope

An issuer signs a canonical `A2SPA-R/1` envelope before execution. The current implemented claims are:

| Claim | Purpose |
|---|---|
| `protocol`, `algorithm`, `issuer`, `keyId` | Version, algorithm, issuer, and verification key |
| `tenant`, `workload`, `audience`, `permissions` | Bind caller workload, deployment audience, and action scope |
| `policy` | Bind exact policy ID, version, and signed-pack digest |
| `issuedAt`, `expiresAt`, `nonce` | Bound validity and atomic replay prevention |
| `context`, `claimsDigest` | Bind action, payload digest, purpose, institution, jurisdiction, retention, approval, and extensible provenance |

The verifier validates exact schema, canonicalization, ES256 signature, trusted issuer/key validity and revocation, audience/tenant/workload, time, active policy digest, action/payload/context, and atomically consumes the nonce. The policy engine separately evaluates purpose, jurisdiction/institution, prohibitions, human approval, and rights. Failures deny execution and emit minimized audit events.

## Action receipt

After execution, the service signs `A2SPA-R-RECEIPT/1` containing authorization/payload/context digests, receipt/request IDs, policy/deployment references, actor/workload/tenant/action, policy decision, outcome, timestamps, retention, algorithm, and key ID. Result digests may appear in outcome metadata. A receipt proves recorded processing, not legality, correctness, fairness, or entitlement.

## Privacy and integrity

Receipts contain identifiers and commitments rather than raw payloads. Selective disclosure remains a design target. Original and disclosed forms require immutable production storage, access logs, legal holds, deletion rules, revocation status, and verifier tooling. ES256 and `A2SPA-R-JCS-IJSON-1` are implemented but remain subject to independent security review.