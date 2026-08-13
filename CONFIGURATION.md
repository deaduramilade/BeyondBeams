# Configuration Reference

The application reads `process.env` directly; it does not currently load `.env` files. Values must be injected by the shell, process manager, container platform, or secret manager.

| Variable | Component | Required | Sensitive | Description |
|---|---|---:|---:|---|
| `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URI` | Identity | Yes | No | Trusted issuer, API audience, and HTTPS JWKS endpoint |
| `A2SPA_AUDIENCE`, `A2SPA_TRUSTED_KEYS` | Authorization | Yes | No | Executor audience and issuer public-key records |
| `POLICY_TRUSTED_KEYS`, `POLICY_PACKS`, `ACTIVE_POLICY` | Policy | Yes | No | Publisher public keys, signed packs, and exact active pack |
| `REVOKED_POLICIES` | Policy | No | No | Revoked pack ID/version records |
| `RECEIPT_PRIVATE_KEY` | Development signer | Yes | Critical | Development only; production uses KMS/HSM adapter |
| `RECEIPT_KEY_ID`, `DEPLOYMENT_DIGEST` | Receipt | Yes | No | Receipt key reference and immutable deployment digest |
| `REPLAY_STORE_DIR`, `AUDIT_STORE_DIR` | Persistence | Yes | Sensitive path | Absolute ignored local directories |
| `METRICS_TOKEN` | Metrics | No | Yes | Separate scrape credential; absent disables discovery |
| `AUTHORIZATION_ISSUER`, `AUTHORIZATION_KEY_ID`, `AUTHORIZATION_PRIVATE_KEY` | Case authorization | Case workflows | Critical | Trusted server-side issuer; production must use an approved KMS/HSM adapter and corresponding public key in `A2SPA_TRUSTED_KEYS` |
| `APP_ORIGIN`, `SESSION_COOKIE_NAME` | Browser session | Provider adapter | No | Exact public HTTP origin used for CSRF checks and validated cookie name; HTTPS origin enables `Secure` cookies |
| `OIDC_LOGIN_URL` | Legacy broker sign-in | No | No | Redirect-only compatibility path; it does not configure callback, session, CSRF or logout adapters |
| `CASE_STORE_DIR` | Case persistence | No | Sensitive path | Absolute ignored local development directory; production requires a selected transactional database adapter |
| `HOST` | Server | No | No | Bind address; defaults to `127.0.0.1` |
| `PORT` | Server | No | No | Numeric port; defaults to `3000` |
| Browser endpoint | Dashboard | No | No | Derived from the current origin; no privileged value is bundled |

## Safe formatting

```text
OIDC_ISSUER=https://identity.example.invalid/issuer
A2SPA_TRUSTED_KEYS=[{"issuer":"issuer.example","keyId":"key-1","algorithm":"ES256","publicKey":"replace-at-runtime"}]
POLICY_PACKS=[{"replace":"with-signed-pack"}]
RECEIPT_PRIVATE_KEY=replace-with-escaped-development-key-at-runtime
```

Never place private PEM content, bearer tokens, metrics credentials, connection strings, or production identifiers in examples, logs, issues, or pull requests. `POLICY_PACKS` is a development transport; production needs an approved publication/revocation source. The process environment development signer does not satisfy production key custody.

## Provider contract boundary

`src/integrations/contracts.js` defines the minimum interfaces for identity/session, signer, persistence/outbox, queue, records, scanner, notification, document, policy, and telemetry providers. `src/integrations/synthetic-platform.js` is deterministic test infrastructure and has no runtime environment switch. It must not be enabled for real data or treated as a provider configuration.

A selected adapter must document its runtime variables separately after deployment review. At minimum, configuration must identify approved endpoints and regions, client/key/resource identifiers, secret-manager references, timeouts, retry budgets, retention and legal-hold controls, logout/revocation routes, backup policy, telemetry destination, and fail-closed behavior. Do not add real credentials, tenant IDs, connection strings, or production resource names to this file.

Programmatic runtime assembly must inject both `identityProvider` and `tokenExchange` to enable `/auth/callback`. Omitting either fails closed. `APP_ORIGIN` must be an exact origin with no path, query or fragment. Cookie-authenticated mutations reject absent or different origins and invalid CSRF tokens.