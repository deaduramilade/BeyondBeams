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