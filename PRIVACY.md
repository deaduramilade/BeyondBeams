# Privacy Notice Framework

This file documents engineering expectations; it is not yet a complete end-user privacy notice. The operating data controller must publish a jurisdiction-appropriate notice before collecting real personal data.

## Prototype behavior

Clients submit operator-provided JSON to the API. The service processes it in memory and may print selected values to console. No database, analytics SDK, cookie system, or telemetry service is declared in the current manifest. Hosting and browser platforms may introduce separate processing that must be assessed.

## Production notice requirements

Identify the controller and contact, purposes and lawful bases, data categories and sources, recipients/subprocessors, locations and transfers, retention, rights and complaint channels, automated decision-making, security summary, whether fields are mandatory, children’s-data policy, and revision date.

## Engineering requirements

Default to synthetic data; minimize fields; redact logs; provide purpose-bound schemas; avoid decisions with legal or similarly significant effects without governance; support notice, access, correction, deletion, restriction, objection, portability, appeal, and human-remedy workflows where applicable; and test retention/deletion. Provide localized, accessible notices and non-digital alternatives. Privacy leads must approve new processing before implementation.