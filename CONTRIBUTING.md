# Contributing to Oblivion-AI

## Branch and pull-request workflow

`main` is the integration branch. Do not commit new work directly to `main`.

1. Start from the latest `main`:

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c feature/short-description
   ```

2. Make focused changes and commit them with clear, imperative messages.
3. Run the relevant tests and security checks locally.
4. Push the feature branch and open a pull request targeting `main`:

   ```bash
   git push --set-upstream origin feature/short-description
   ```

5. Merge only through an approved pull request after review and successful
   validation. Keep `main` deployable and never force-push it.

## Security requirements

- Never commit `.env` files, API keys, access tokens, private keys, passwords,
  connection strings, or other credentials.
- Use `.env.example` for configuration documentation with placeholder values.
- Treat all browser configuration as public. Do not put privileged secrets in
  client bundles.
- If a secret is exposed, revoke or rotate it immediately; removing it from a
  later commit does not remove it from Git history.

## Commit conventions

Use a Conventional Commit-style prefix where practical:

- `feat`: user-visible functionality
- `fix`: bug correction
- `docs`: documentation
- `test`: tests
- `chore`: maintenance and configuration

Keep each commit focused and explain the purpose rather than merely listing
the files changed.

## Change requirements

- Add or update tests for changed behavior. Explain any temporary test gap.
- Update API, configuration, architecture, security, and operational documents
  when their contracts or assumptions change.
- Update `PROJECT_STATUS.md` for completed milestones, new risks, blockers, and
  next actions; reserve `CHANGELOG.md` for user-visible release changes.
- Add an ADR for consequential architecture, cryptography, identity, data,
  vendor, persistence, or deployment decisions.
- Use synthetic data in tests and examples.

## Pull-request review

A pull request should state purpose, behavior, risk, validation evidence,
configuration or migration impact, and rollback considerations. Security- or
privacy-relevant changes require qualified review. Do not merge with unresolved
critical findings, failing required checks, undocumented secrets, or unapproved
compliance claims.

Read `CHARTER.md` for product boundaries, `AGENTS.md` for automated-assistant rules, `DEVELOPMENT.md` for local setup,
`TESTING.md` for validation expectations, and `SECURITY.md` for disclosure and
production security requirements.