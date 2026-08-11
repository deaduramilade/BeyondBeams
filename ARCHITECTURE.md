# Architecture

## Overview

Oblivion-AI is currently a single-process Node.js agent-routing prototype with browser and Expo clients plus a Copilot Studio export. It is not a production reference architecture.

| Component | Responsibility | Trust |
|---|---|---|
| Dashboard and mobile app | Submit actions | Untrusted clients |
| Express API | API-key check and HTTP translation | Security boundary |
| `OblivionAI` | Prefix-based dispatch | Internal router |
| Domain agents | Sign, verify, and simulate outcomes | Privileged process |
| Runtime secret source | Supply API and EC keys | Highest sensitivity |
| Copilot export | Declarative assets, not wired to runtime | Source artifact |

## Request flow

1. Client posts `actionType` and `payload` to `/execute` with `x-api-key`.
2. Express maps the key to a tier from `API_KEYS`.
3. The orchestrator selects an agent by action prefix.
4. The agent hashes `JSON.stringify(payload)`, creates an envelope with timestamp and UUID nonce, signs it, and immediately verifies it.
5. A successful check returns a simulated domain result; failures become HTTP 403 responses.

## A2SPA boundary

The implementation demonstrates signature mechanics, but does not yet prove independent caller authorization: the receiving process creates the signature after accepting a request. Nonces are not persisted or checked for reuse, and JSON serialization is not formally canonical. Runtime JavaScript agents duplicate cryptographic logic while `A2SPA.ts` is a separate reference implementation.

## State and integrations

There is no database, queue, nonce store, durable audit ledger, cache, object storage, or active runtime integration with the Copilot export. Generated IDs and outcomes exist only in responses and console logs.

## Known risks and target direction

Current gaps include static bearer keys, unrestricted CORS, no schema validation, no rate limiting, internal error disclosure, no health endpoint, no monitoring, and no graceful shutdown. The target is centralized A2SPA, externally issued authorization envelopes, canonical serialization, consumed-nonce persistence, scoped credentials, validated schemas, tamper-evident audit events, and independently deployable adapters. Record each material transition in an ADR.