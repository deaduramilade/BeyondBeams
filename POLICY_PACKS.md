# Policy Packs and Authorization

## Implemented format

`oblivion.policy-pack/1` is a canonical JSON, ES256-signed policy artifact. The signed fields bind pack ID/version, publisher and key ID, institution, jurisdiction, publication/effective/expiry times, predecessor, approvals, and ordered rules. `policyDigest()` uses the A2SPA-R canonical serializer with domain `policy-pack`; the signature is excluded from that digest and signing input.

Each rule has an ID, `permit` or `deny` effect, exact actions, exact purposes, permitted principal types, human-approval requirements, and notice/human-review/appeal/remedy flags. Deny rules take precedence and unmatched requests deny by default. Runtime decisions bind the caller type and authorization context's institution, jurisdiction, purpose, action, and human approval. Approval records have an exact schema, and the requesting principal cannot self-approve. Decisions return a random decision ID, reason, applicable rule, policy identity/digest, and rights metadata; the API writes this decision to the tamper-evident audit ledger without payload data.

## Publication workflow

1. A policy author prepares a new immutable version and records its predecessor.
2. The institution maps legal authority, prohibited uses, purposes, affected groups, rights, remedy, records, accessibility, language, and sovereignty obligations outside the executor.
3. Distinct `policy-owner` and `legal-rights` approvals are mandatory; security approval may be required by local governance. Approval identifiers and times are evidence references, not proof that approval occurred.
4. A controlled publisher signs the reviewed canonical pack with a policy key separate from authorization and receipt keys.
5. Operations publish the signed pack and trusted public key, verify signature/digest, stage synthetic deny/permit tests, then activate an exact ID/version/digest through change control.
6. Activation and rollback are audited. Revocation immediately makes an active pack not ready; rollback may select only another valid, published, unrevoked version.

Never distribute publisher private keys with packs or place them in environment files. Production publication needs dual control, immutable artifact storage, key lifecycle controls, environment separation, and a durable revocation source. `POLICY_PACKS` is a development transport, not a production publication service.

## Validation boundary

Automated tests use a synthetic institution and jurisdiction and validate signature tampering, digest stability, binding, purpose limitation, prohibited actions, human approval and self-approval denial, rights, revocation, and rollback. This is not independent validation of a jurisdictional implementation. Live use remains blocked until a named institution supplies a real pack and an independent qualified legal/rights assessor validates its scoped mapping, tests, findings, and remediation.