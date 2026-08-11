# A2SPA-R Action Envelope and Receipt Profile

**Status:** Design target; not implemented by the current prototype

## Authorization envelope

An issuer signs a canonical, versioned envelope before execution. Required claims are:

| Claim | Purpose |
|---|---|
| `profile`, `version`, `envelopeId` | Format negotiation and stable identity |
| `issuer`, `keyId`, `subject` | Bind authorization to issuer, key, person, service, or workload |
| `action`, `resource`, `payloadDigest` | Bind exact operation, target, and canonical input |
| `purpose`, `authority`, `jurisdiction` | Bind declared purpose and locally approved policy authority |
| `policyId`, `policyVersion`, `decisionId` | Identify the policy decision and immutable version |
| `model`, `tools`, `provenance` | Identify model, configuration, sources, and delegated tools |
| `humanApproval` | Record required approver role, decision, time, and assurance method |
| `issuedAt`, `notBefore`, `expiresAt`, `nonce` | Bound validity and enable atomic replay prevention |
| `retentionClass`, `disclosurePolicy` | Bind evidence lifecycle and permitted disclosure |

The verifier must validate schema, canonicalization, signature and algorithm policy, trusted issuer and key status, audience, time bounds, policy status, human-approval requirements, and atomically consume the nonce before execution. Failures deny execution and emit a minimal rejection event.

## Action receipt

After execution, the accountable execution service signs a receipt containing the envelope digest; receipt ID; outcome and reason code; executor identity; start/end times; actual model/tool versions; policy and human-review references; output/effect digests; evidence-store reference; retention and appeal references; and signing key ID. A receipt proves recorded processing, not legality, correctness, fairness, or entitlement.

## Privacy and integrity

Receipts should contain opaque identifiers and commitments rather than raw personal data. Selective disclosure may use derived redacted receipts or cryptographic proofs linked to the original digest. Original and disclosed forms require tamper-evident storage, access logs, legal holds, deletion rules, revocation status, and verifier tooling. Algorithms and canonical serialization remain to be selected through security review and an ADR.