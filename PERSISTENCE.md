# Persistence and Resilience Architecture

## Current implementation

The prototype has file-backed replay, hash-chained audit, and reference queue stores. Writes use local locks and atomic replacement where applicable; the queue supports tenant/type/idempotency-key deduplication, leases, lease expiry, bounded retries, and dead-letter state. These stores support deterministic development tests on one host. They are not replicated databases, immutable object stores, transactional outboxes, or production durability evidence.

## Production target

Select provider-neutral capabilities through deployment review: a transactional regional database for policy metadata, revocations, idempotency, and workflow state; a durable queue with visibility timeout and dead-letter isolation; append-only/WORM-capable object storage for signed receipts and audit checkpoints; encrypted backup/object storage in approved locations; and an optional bounded cache containing no source of truth. Every resource, replica, backup, key, telemetry stream, operator, and support path must satisfy the approved sovereignty map.

Admission is fail closed when identity, authorization, active policy, replay consumption, required audit write, or receipt signer is unavailable. Do not execute first and repair evidence later. Queue consumers are at-least-once: use a stable tenant-scoped idempotency key, atomically persist state/outbox, lease work, make effects idempotent where possible, acknowledge only after durable outcome/audit writes, retry transient errors with capped exponential backoff and jitter, and quarantine poison messages. Manual replay requires scoped approval and audit.

## Availability, backup, and recovery

Document dependency timeouts, retry budgets, circuit breaking, quorum/consistency behavior, regional failure, partial writes, stale reads, storage exhaustion, corruption, and control-plane loss. Backups must be encrypted with separately governed keys, access-controlled, inventory-tested, retention-bound, integrity-checked, and protected from ordinary deletion. Legal hold overrides deletion; expired data and backup copies follow an approved, tested schedule.

No RTO or RPO is approved or measured. Before launch, complete a business-impact analysis per component, define approved RTO/RPO and service hours, run timed restore tests into an isolated account/region, verify authorization/policy/audit/replay consistency and data loss, record measured results, and remediate misses. Capacity tests must cover expected and burst ingress, large valid payloads, nonce contention, audit growth, queue backlog, retries, exports, policy activation, dependency latency, storage exhaustion, and recovery while preserving fail-closed behavior.