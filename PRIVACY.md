# Privacy Notice Framework

This file documents engineering expectations; it is not yet a complete end-user privacy notice. The operating data controller must publish a jurisdiction-appropriate notice before collecting real personal data.

## Prototype behavior

Clients submit validated JSON and signed authorization context. The service processes payloads in memory; receipts/audit/queue use digests and opaque references rather than raw payloads. No external analytics SDK, cookie system, production database, or telemetry vendor is selected. Hosting, identity, logging, metrics, tracing, backup, and support platforms introduce processing that must be assessed.

## Production notice requirements

Identify the controller and contact, purposes and lawful bases, data categories and sources, recipients/subprocessors, locations and transfers, retention, rights and complaint channels, automated decision-making, security summary, whether fields are mandatory, children’s-data policy, and revision date.

## Engineering requirements

Default to synthetic data; minimize fields; redact logs; provide purpose-bound schemas; avoid decisions with legal or similarly significant effects without governance; support notice, access, correction, deletion, restriction, objection, portability, appeal, and human-remedy workflows where applicable; and test retention/deletion. Provide localized, accessible notices and non-digital alternatives. Privacy leads must approve new processing before implementation.