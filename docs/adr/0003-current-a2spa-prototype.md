# ADR-0003: Treat current A2SPA as a provisional prototype

Date: 2026-08-11  
Status: Provisional  
Decision owners: Project maintainers

## Context

Each runtime agent hashes a payload, creates an envelope, signs it with an EC private key, and verifies it locally. Similar code is duplicated, nonces are not consumed, and the server itself creates authorization after receiving a request.

## Decision

Retain the mechanism for development demonstrations while explicitly withholding production-security and compliance claims. Place future behavior behind tests, centralize implementation, specify canonical serialization, separate authorization issuance, and add replay persistence before production consideration.

## Consequences

Current outputs prove local key-pair verification only. They do not prove independent human or service authorization and do not withstand a compromised signing process. Security documentation and user interfaces must not imply otherwise. This ADR must be superseded by the reviewed production protocol decision.