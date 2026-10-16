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
| `main` | Production code. Deployed when a release is cut (see Releases). | Pull requests from `develop` (or `hotfix/*`) only |
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

### Who merges

- Into `develop`: anyone, including a coding agent, through `scripts/git/merge-to-develop.sh <pr>`.
  It refuses any other base branch, a draft, a title outside the commit format, a forbidden
  mention, or checks that are not green; then it squash-merges and deletes the branch.
- Into `main`: **only the maintainer**, by hand. A coding agent never merges into `main`: the
  shared agent settings deny `gh pr merge` and direct pushes to `main` and `develop`, so the
  script above is its only way to merge.

## Releases

Versions follow [SemVer](https://semver.org) and are tagged `vX.Y.Z` on `main`. Nobody picks
the number by hand: [release-please](https://github.com/googleapis/release-please) derives it
from the commits merged since the last tag.

| Commits since the last release | Next version |
| --- | --- |
| only `fix` / `perf` | patch: `1.4.2` → `1.4.3` |
| at least one `feat` | minor: `1.4.2` → `1.5.0` |
| a `!` or a `BREAKING CHANGE:` footer | major: `1.4.2` → `2.0.0` |

How a release goes:

1. `develop` is merged into `main` (merge commit, by the maintainer).
2. The `Release` workflow opens, or updates, a pull request `chore(main): release X.Y.Z` with
   the new `CHANGELOG.md` entry. It stays open and grows with each merge into `main`.
3. When the release should be cut, the maintainer merges that PR (**Create a merge commit**).
   The workflow then tags `vX.Y.Z`, publishes the GitHub release with the same notes, builds
   the images `backend-lescracks:vX.Y.Z` and `frontend-lescracks:vX.Y.Z` and deploys them.

Merging `develop` into `main` alone deploys nothing. A change with no `feat`, `fix`, `perf` or
`revert` commit (a refactor, a dependency bump) opens no release PR: ship it with the next
release, or force one with `Release-As`.

### Redeploy or roll back

Actions → **Deploy** → **Run workflow**, with the version to run (`v1.4.0`). Its images are
reused from Docker Hub as they are, and its own `docker-compose.prod.yml` goes with them, so
an earlier version rolls the whole stack back. Database migrations do not roll back: a release
with a Flyway migration can only be undone by a new release.

The changelog lists `feat`, `fix`, `perf` and `revert`; the other types stay out of it, so
the commit type decides what users get to read. To force a number, add a `Release-As: x.y.z`
line to a commit body.

`CHANGELOG.md`, `version.txt` and `.release-please-manifest.json` belong to the release
workflow: never edit them by hand, on `develop` or anywhere else.

## Dependencies and credentials

- Dependabot opens update PRs against `develop` every Monday: GitHub Actions, Maven, pnpm
  and the Docker base images (majors of Node and Java excluded). They go through CI and
  are merged like any other PR.
- The `Credentials check` workflow tests the Docker Hub token, `RELEASE_PLEASE_TOKEN` (and its
  expiry date, 30 days ahead) and SSH access to the VPS every Monday. A red run means a secret
  to renew before the next release.

The workflow needs the secret `RELEASE_PLEASE_TOKEN`: a fine-grained personal access token
limited to this repository, with **Contents**, **Pull requests** and **Issues** set to
read and write. `GITHUB_TOKEN` cannot be used: what it creates triggers no workflow, so the
required `Commit messages` check would never run on the release PR.

## Checks before a PR

CI runs the same checks on every pull request (`Backend tests`, `Frontend checks`, and a build
of both Docker images), plus `Commit messages`. Run them locally first:

```bash
cd frontend && pnpm typecheck && pnpm lint && pnpm build
cd backend  && ./mvnw test        # ./mvnw verify when persistence changed (needs Docker)
```
