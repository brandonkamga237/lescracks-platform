# Contributing to LesCracks

## First setup (once per clone)

```bash
git config core.hooksPath .githooks
```

This enables the `commit-msg` hook that checks every message before the commit is created.
CI runs the same check (`scripts/git/check-commit-msg.sh`) on every pull request, so a
skipped hook is still caught.

## Branches

| Branch | Role | Who writes to it |
| --- | --- | --- |
| `main` | Production. A push to `main` deploys. | Pull requests from `develop` (or `hotfix/*`) only |
| `develop` | Integration of finished work | Pull requests from work branches only |
| `feature/*`, `fix/*`, `docs/*`, `chore/*` | One piece of work | You |
| `hotfix/*` | Production emergency, cut from `main` | You |

- Cut work branches from the remote without tracking it, so a plain `git push` can never
  land on `develop`:
  ```bash
  git fetch origin
  git switch -c feature/event-waitlist --no-track origin/develop
  git push -u origin feature/event-waitlist
  ```
- Names are short, English, kebab-case.
- `main` and `develop` are protected: no direct push, no force push, no deletion, and a
  pull request can only merge once CI is green.

## Commit messages

```
type(scope): description
```

- **type**: `feat` (user-facing addition), `fix` (bug fix), `perf`, `refactor` (no behaviour
  change), `docs`, `test`, `build` (dependencies, Dockerfiles), `ci` (workflows), `chore`
  (tooling, housekeeping), `style` (formatting only), `revert`.
- **scope** (optional, lowercase): the domain or area touched. Backend domains: `identity`,
  `resource`, `taxonomy`, `event`, `newsletter`, `stats`, `storage`, `mail`, `seo`,
  `cracklab`. Cross-cutting: `ui`, `admin`, `auth`, `ci`, `docker`, `deps`, `keycloak`,
  `tooling`.
- **description**: English, imperative or a plain statement of the result, 100 characters
  max for the whole header.
- **breaking change**: add `!` after the type or scope (`feat(api)!: drop the v1 routes`) and
  explain it in the body.
- **body** (optional): the why and any consequence (a migration to apply, a variable to set).
  Not a file list: the diff already is one.

One commit is one logical change that compiles and passes its checks. Commit as you go.

### Never in a commit or a pull request

No mention of Claude, Anthropic, AI or any generation tool: no `Co-Authored-By` trailer for
a tool, no "Generated with …" line, nothing in the body or the PR description. The author of
the work is the person who opens the PR. The hook and CI reject these mentions; the only
accepted occurrences are the file name `CLAUDE.md` and the `.claude/` directory.

Also never: secrets or `.env`, `git push --force`, rewriting history that is already pushed,
editing a Flyway migration that is already applied.

## Pull requests

- Into `develop`: **squash merge**. The PR title becomes the commit, so it follows the
  commit format above (`feat(cracklab): show the score in points`). CI checks the title, the
  description and every commit of the PR.
- From `develop` into `main`: **merge commit**, never squash. A squash would create a commit
  on `main` that `develop` does not have, and the two branches would drift apart at every
  release.
- Fill in the PR template: what, why, the checks you ran, and anything to do on deploy.

## Checks before a PR

```bash
cd frontend && pnpm typecheck && pnpm lint && pnpm build
cd backend  && ./mvnw test        # ./mvnw verify when persistence changed (needs Docker)
```
