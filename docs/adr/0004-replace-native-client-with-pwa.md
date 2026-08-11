# ADR 0004: Replace the Native Client with a PWA

**Status:** Accepted

**Date:** 2026-08-11

## Context

The prototype had a separate Expo client and browser dashboard. Maintaining two clients increased dependency, release, secret-handling, accessibility, and distribution obligations without an established requirement for native device APIs. GitHub Education currently provides development and cloud benefits, but no benefit makes a native framework necessary. Codespaces is development infrastructure; GitHub Pages is static hosting and cannot run the API.

## Decision

Remove the Expo client and make the browser dashboard an installable responsive progressive web application. Keep it dependency-light and same-origin during the prototype. Evaluate the Student Pack's Azure benefit for development deployments only; production hosting remains a jurisdiction-specific procurement and sovereignty decision.

## Consequences

One client serves desktop and mobile browsers, can be installed where browser policy permits, and can be hosted by a government-controlled platform. Offline behavior is limited to the application shell; actions always require an authenticated network connection. Native capabilities require a future ADR and demonstrated public-service need.