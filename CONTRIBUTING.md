# Contributing to LesCracks

## First setup (once per clone)

```bash
git config core.hooksPath .githooks
```

This enables the `commit-msg` hook that checks every message before the commit is created.
CI runs the same check (`scripts/git/check-commit-msg.sh`) on every pull request, so a
skipped hook is still caught.

## Branches

| Branch | Permanent | Role | Deleted |
| --- | --- | --- | --- |
| `main` | yes | Production: every merge into it is deployed | never |
| `develop` | yes | Integration of finished work | never |
| `feature/*`, `fix/*`, `docs/*`, `chore/*` | no | One piece of work, cut from `develop`, merged into `develop` | automatically, once merged |
| `hotfix/*` | no | Production emergency, cut from `main`, merged into `main` | automatically, once merged |

There are no release branches: what runs in production becomes a version when the maintainer
tags it (see Deployments and versions).

The model is enforced, not just written down:

- The `Branch name` check refuses a pull request whose branch breaks it: an unknown prefix, a
  `release/*` branch, a hotfix aimed at `develop`, or anything other than `develop` and
  `hotfix/*` aimed at `main` (`scripts/git/check-branch.sh`).
- GitHub deletes a branch as soon as its pull request is merged.
- A hotfix comes back to `develop` on its own: after any change reaches `main` without going
  through `develop`, the `Back-merge` workflow opens the pull request `main` → `develop`.
- `scripts/git/prune-branches.sh` deletes your local copies of merged branches
  (`--dry-run` to see them first).

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
- **scope** (optional, lowercase): the domain or area touched. Backend domains: `account`, `member`,
  `resource`, `taxonomy`, `event`, `newsletter`, `stats`, `storage`, `mail`, `seo`,
  `community`, `recognition`, `talk`. Cross-cutting: `ui`, `admin`, `auth`, `ci`, `docker`, `deps`, `keycloak`,
  `tooling`.
- **description**: English, imperative or a plain statement of the result, 100 characters
  max for the whole header.
- **breaking change**: add `!` after the type or scope (`feat(api)!: drop the v1 routes`) and
  explain it in the body.
- **body** (optional): the why and any consequence (a migration to apply, a variable to set).
  Not a file list: the diff already is one.

Commits are **atomic and many**: one commit per smallest change that stands on its own and
leaves the build green, made as you go. A migration, a store method, a service rule, a DTO, a
route, a test, an email template, a component, a label or a doc section is each its own commit
when it can be. Refactoring, behaviour and formatting never share a commit, nor do backend,
frontend and docs. Since pull requests are rebase-merged, this granularity is the history of
`develop` and `main`.

### Never in a commit or a pull request

No mention of Claude, Anthropic, AI or any generation tool: no `Co-Authored-By` trailer for
a tool, no "Generated with …" line, nothing in the body or the PR description. The author of
the work is the person who opens the PR. The hook and CI reject these mentions; the only
accepted occurrences are the file name `CLAUDE.md` and the `.claude/` directory.

Also never: secrets or `.env`, `git push --force`, rewriting history that is already pushed,
editing a Flyway migration that is already applied.

## Pull requests

- Into `develop`: **rebase merge**. Every commit of the branch lands on `develop` as it is, so
  each one must follow the commit format above and leave the build green on its own. CI checks
  the title, the description and every commit of the PR.
- From `develop` or `hotfix/*` into `main`, and from `main` back into `develop`: **merge
  commit**, never squash or rebase. Either would create commits one branch has and the other
  does not, and `main` and `develop` would drift apart at every deployment.
- Fill in the PR template: what, why, the checks you ran, and anything to do on deploy.

### Who merges

- Into `develop`: anyone, including a coding agent, through `scripts/git/merge-to-develop.sh <pr>`.
  It refuses any other base branch, a draft, a title outside the commit format, a forbidden
  mention, or checks that are not green; then it rebase-merges and deletes the branch, or,
  for `main` coming back after a hotfix, merges with a merge commit.
- Into `main`: **only the maintainer**, by hand. A coding agent never merges into `main`: the
  shared agent settings deny `gh pr merge` and direct pushes to `main` and `develop`, so the
  script above is its only way to merge.

## Deployments and versions

Deploying and versioning are two separate things.

**Every merge into `main` is deployed.** The `Deploy` workflow builds the images of that commit
(`backend-lescracks:sha-<commit>` and `frontend-lescracks:sha-<commit>`) and runs them in
production, about five minutes after the merge. It creates no tag and no version.

**A version is the maintainer's decision.** When what runs in production deserves a version,
the maintainer runs Actions → **Tag a version** → **Run workflow** with the number. It tags the
commit of the last successful deployment (or another commit given in the form) as `vX.Y.Z`,
publishes the GitHub release with notes generated from the pull requests merged since the
previous version, and adds the version to that commit's images. Nothing else ever creates a
tag.

Versions follow [SemVer](https://semver.org), and the number is picked by hand:

| Since the last version | Next version |
| --- | --- |
| only fixes | patch: `1.4.2` → `1.4.3` |
| at least one new feature | minor: `1.4.2` → `1.5.0` |
| a breaking change | major: `1.4.2` → `2.0.0` |

The workflow refuses a number that exists already or is not higher than the last version.

### Redeploy or roll back

Actions → **Deploy** → **Run workflow**, with the commit, branch or tag to run (`v1.4.0`, or a
commit hash). Its images are reused from Docker Hub when they exist, built otherwise, and its
own `docker-compose.prod.yml` goes with them, so an earlier commit rolls the whole stack back.
Database migrations do not roll back: a change with a Flyway migration can only be undone by
a new change.

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
