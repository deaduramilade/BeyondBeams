# Configuration Reference

The application reads `process.env` directly; it does not currently load `.env` files. Values must be injected by the shell, process manager, container platform, or secret manager.

| Variable | Component | Required | Sensitive | Description |
|---|---|---:|---:|---|
| `API_KEYS` | Server | Yes | Yes | JSON object mapping bearer keys to tier labels |
| `OWNER_PRIVATE_KEY` | Agents | Yes | Critical | PEM EC private key; escaped newlines accepted |
| `OWNER_PUBLIC_KEY` | Agents | Yes | Usually no | Matching PEM public key |
| `HOST` | Server | No | No | Bind address; defaults to `127.0.0.1` |
| `PORT` | Server | No | No | Numeric port; defaults to `3000` |
| Browser endpoint | Dashboard | No | No | Derived from the current origin; no privileged value is bundled |

## Safe formatting

```text
API_KEYS={"replace-with-random-development-value":"developer"}
OWNER_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
OWNER_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n
```

Never place real PEM content in `.env.example`, logs, issue reports, or pull requests. Validate `API_KEYS` as JSON before launch. Tier labels are returned to clients but do not currently enforce scopes. Production must use independently managed secrets, separate client/server credentials, explicit rotation, and least-privilege authorization.