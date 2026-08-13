# Observability and Operations

## Signals and collection

The service emits structured JSON logs and a credential-protected `/metrics` endpoint. Current metrics cover request outcomes, policy decisions, and policy/audit/receipt-signer readiness. Labels are deliberately low-cardinality and must never contain tenant, actor, token, request payload, subject identifier, key material, or personal data. Send stdout/stderr to an approved centralized collector over authenticated encrypted transport; restrict access, redact at source, pin storage/backup regions, integrity-protect operational audit exports, and apply approved retention/legal hold.

The provider-neutral telemetry contract has an in-memory synthetic implementation for rejecting named sensitive fields, measuring a supplied clock offset, and evaluating alert rules linked to runbooks. This proves interface behavior only. It does not collect runtime logs, metrics, or traces centrally; deliver alerts; monitor host time; staff on-call; or provide retention, sovereignty, availability, and incident evidence.

Production instrumentation must add latency histograms, authorization/replay/authentication/rate-limit outcomes, audit append/integrity/checkpoint age, queue depth/oldest age/retry/dead-letter counts, persistence latency/errors/capacity, signer/key age/revocation/status, OIDC/JWKS cache and failure status, policy expiry/activation/revocation, backup age/restore evidence, clock offset, event-loop/resource saturation, and safe abuse/anomaly aggregates. Use W3C trace context only across approved service boundaries; sample deliberately and include opaque request/decision/receipt IDs, never payloads or credentials.

## SLI, SLO, and alert governance

The figures in `PRODUCTION_ASSURANCE.md` are synthetic-pilot proposals only. An accountable service owner must approve SLI definitions, measurement source, window, service hours, exclusions, maintenance, target, error-budget policy, and escalation before any value is called an SLO. Dashboards should cover admission success/latency, authorization quality, evidence durability, dependency health, saturation, remedy delivery, and regional health.

Page on sustained admission/error-budget burn, audit integrity or required-write failure, replay-store failure, active policy invalid/revoked/near expiry, signer unavailable/revoked/near expiry, identity-provider outage, backup/restore evidence overdue, material clock drift, queue age/dead letters, storage exhaustion, or anomalous denial/replay/rate-limit spikes. Exact thresholds require baseline/load evidence and institutional approval. Alerts need a primary owner, alternate, coverage hours, severity, runbook, deduplication, tested delivery, and periodic review; no on-call ownership is recorded yet.

## Time and incident exercises

Hosts and managed dependencies must use authenticated platform time sources, monitor offset and synchronization state, and preserve UTC timestamps. Exceeding approved drift fails time-sensitive admission closed. Exercise credential theft, signing-key failure, unsafe policy activation, audit corruption, replay attack, queue backlog, regional loss, restore, monitoring loss, and suspected data disclosure before launch. Record detection time, command assignment, containment, communications, recovery, evidence integrity, lessons, owners, and due dates.