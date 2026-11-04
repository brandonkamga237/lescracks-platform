#!/usr/bin/env bash
# Checks that a pull request follows the branching model: which branch may go into which.
# main and develop are permanent; every other branch is short-lived and deleted once merged.
# There are no release branches: what runs in production becomes a version when the
# maintainer tags it (tag-version.yml).
#
#   into develop: feature/*, fix/*, docs/*, chore/*, dependabot/*, or main (back-merge)
#   into main:    develop (shipping) or hotfix/*
#
# Usage: scripts/git/check-branch.sh <head-branch> <base-branch>
set -euo pipefail

head="${1:?usage: check-branch.sh <head-branch> <base-branch>}"
base="${2:?usage: check-branch.sh <head-branch> <base-branch>}"

fail() {
  echo "✖ $head → $base: $1" >&2
  echo "  See CONTRIBUTING.md (Branches)." >&2
  exit 1
}

short_lived='^(feature|fix|docs|chore|hotfix)/[a-z0-9][a-z0-9._/-]*$'

if [[ "$head" == release/* ]]; then
  fail "release branches are not used. Merge develop into main, then tag the version from Actions > Tag a version."
fi
if [[ "$head" != "main" && "$head" != "develop" && "$head" != dependabot/* && ! "$head" =~ $short_lived ]]; then
  fail "the branch name must be feature/, fix/, docs/, chore/ or hotfix/ followed by lowercase words joined by hyphens."
fi

case "$base" in
  develop)
    [[ "$head" == hotfix/* ]] && fail "a hotfix fixes production: open it against main (it comes back to develop on its own)."
    [[ "$head" == "develop" ]] && fail "a branch cannot be merged into itself."
    ;;
  main)
    [[ "$head" == "develop" || "$head" == hotfix/* ]] || fail "only develop (to ship) and hotfix/* (to fix production) go into main."
    ;;
  *)
    fail "pull requests go into develop or main only."
    ;;
esac

echo "✔ $head → $base"
