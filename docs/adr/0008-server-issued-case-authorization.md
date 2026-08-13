# ADR-0008: Issue authorization server-side for governed cases

Date: 2026-08-12

Status: Accepted for synthetic/staging implementation

Decision owners: Project maintainers; deploying institution must approve the identity, policy, workflow, and persistence adapters

## Context

The initial dashboard required users to paste a bearer token and an externally issued A2SPA-R envelope. That is unsuitable for ordinary case work and does not provide durable review state. Optional JSON payload entry is useful for compatible structured data, but must not become an authorization or credential path.

## Decision

Use a configured OIDC broker and same-origin session cookie for browser authentication. Keep bearer authentication for service clients. Add a separate server-side authorization issuer that binds the authenticated tenant, workload, action, payload digest, active policy, purpose, institution, jurisdiction, and retention context into an A2SPA-R envelope. The browser does not receive the envelope. Case creation evaluates policy before storing a submitted case and records the case transition and audit event.

Persist cases through an atomic local adapter with tenant filtering and an explicit transition graph. Reviewer actions require verified role claims and reject requester self-review, conflicting assignment, invalid transitions, and missing roles. Production database, identity broker, KMS/HSM, notification, evidence, and operational adapters remain deployment gates.

## Consequences

Guided forms and explicitly selected JSON input have one server validation and authorization boundary. The service can preserve submissions and a governed timeline without exposing protocol diagnostics to ordinary users. The current case store and issuer are reference adapters and do not establish production durability, key custody, institutional authority, or live-service approval.

## Validation

The implementation is covered by deterministic case-store, dashboard, and API tests. The repository remains `NOT_READY — development/synthetic evaluation only` until production integrations and independent assurance evidence exist.