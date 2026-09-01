---
name: git-workflow
description: Structure branches and commits on LesCracks — the main/develop/feature model, committing progressively while coding, and message format. Use before starting to code, before every commit, and before opening a PR.
---

# Branches and commits

## Before writing the first line

Check where you are:
```
git branch --show-current
```

- On `main` or `develop` → **create a branch before changing anything**:
  ```
  git switch develop && git pull
  git switch -c feature/event-waitlist
  ```
- Already on a work branch that matches the task → keep going on it.

Prefixes: `feature/` (new work), `fix/` (bug fix), `docs/` (documentation, README,
CLAUDE.md), `hotfix/` (production emergency, branches off `main`). Short name, in
English, kebab-case.

PR target: `develop` — except `hotfix/`, which targets `main`.

## Commit progressively

**Do not pile the whole task into one final commit.** As soon as a coherent chunk is
finished and verified, commit it. A typical split for a backend plus frontend feature:

```
feat(events): add waitlist columns          (Flyway migration + entity)
feat(events): expose waitlist in API        (DTO + service + controller + SecurityConfig)
feat(events): show waitlist state on detail (page + frontend service)
test(events): cover waitlist service        (tests)
```

Splitting rules:
- One commit = **one logical change** that compiles and leaves the project healthy
- Never mix in a single commit: a feature and a refactor, code and a large reformat,
  two unrelated subjects
- A rename or file move gets its own commit
- Dependency changes (`pom.xml`, `package.json` + `pnpm-lock.yaml`) travel with the
  code that uses them

Run the checks for the area you touched before each commit:
```
cd backend  && ./mvnw test
cd frontend && pnpm typecheck && pnpm lint
```

Always look at what you are about to include:
```
git status --short
git diff --staged
```
Stage explicitly (`git add <files>`), never a blind `git add -A`: that is how a
`.env`, a dump or a scratch file ends up in history.

## Message format

```
type(scope): imperative description, in English
```

`type` ∈ `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.
`scope` = the area touched (`events`, `seo`, `auth`, `admin`, `ci`, …).

A body is optional and reserved for the **why** and for non-obvious consequences (a
migration to apply, an environment variable to add, changed behaviour). No exhaustive
file list: the diff already provides one.

## Never in a commit

- **No mention of Claude, of AI, or of any generation tool.** No
  `Co-Authored-By: Claude ...` trailer, no "Generated with …", no hint in the body or
  in the PR description. The author of the commits is the user.
- No secrets and no `.env` (see `.gitignore`).
- No `git push --force`, no `git reset --hard` on shared work, no rewriting of
  history that has already been pushed.
- No direct commit on `main` (outside a deliberate `hotfix/`): `main` triggers the
  production deployment.

## Before the PR

```
git fetch origin && git rebase origin/develop
```
Read the branch as a whole and check that it tells a legible story:
```
git log --oneline origin/develop..HEAD
```
