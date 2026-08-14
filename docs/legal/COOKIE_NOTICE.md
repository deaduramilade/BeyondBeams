# BeyondBeams Cookie Notice

**Effective:** 2026-08-14  
**Version:** 1.0  
**Status:** Development-project baseline; not approved for production

## Current browser storage

Public pages do not set analytics, advertising, preference, or social-media cookies. The application does not use `localStorage` or `sessionStorage`, and its styles no longer request fonts from a third-party service.

## Strictly necessary session cookie

After a configured institutional sign-in succeeds, the server sets one opaque authentication cookie.

| Cookie | Purpose | Properties | Duration |
|---|---|---|---|
| `beyondbeams_session` (default; deployers may configure the name) | Authenticate an institutional browser session, enforce tenant and authorization controls, and support logout and rotation | `HttpOnly`, `SameSite=Lax`, path `/`; `Secure` when the configured application origin uses HTTPS | Configured session expiry; the synthetic test provider defaults to 15 minutes |

The server, not browser JavaScript, reads this cookie. Its value is an opaque random identifier, not a user profile or credential.

## Consent and control

The current cookie is strictly necessary for the authenticated workspace requested by the user. The prototype therefore does not show a consent banner for it. Signing out clears the cookie and revokes the local session. Clearing site data also removes it, after which protected features stop working.

An operator that adds optional analytics, personalization, embedded media, advertising, or other browser storage must update this notice and implement valid prior consent and withdrawal controls where applicable.

## Identity provider cookies

A separately configured institutional identity provider may use cookies on its own domain. Those cookies are controlled by that provider and must be described in the operator's identity and privacy notices.

The public application version is hosted at `/legal/cookies`.
