#!/usr/bin/env bash
# Deletes the local branches that are finished: GitHub deletes a branch once its pull request is
# merged, so a local branch whose remote branch is gone has been integrated. main, develop, the
# current branch and branches never pushed are kept.
#
# Usage: scripts/git/prune-branches.sh [--dry-run]
set -euo pipefail
# The upstream state reads "[gone]" only in English; git translates it otherwise.
export LC_ALL=C

dry_run="${1:-}"
git fetch --prune --quiet origin

current="$(git branch --show-current)"
mapfile -t finished < <(git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads \
  | awk '$2 == "[gone]" { print $1 }' \
  | grep -vxE "main|develop|${current:-^$}" || true)

if [[ ${#finished[@]} -eq 0 ]]; then
  echo "✓ Nothing to delete: only main, develop and branches still in progress remain."
  exit 0
fi

for branch in "${finished[@]}"; do
  if [[ "$dry_run" == "--dry-run" ]]; then
    echo "would delete $branch"
  else
    git branch -D "$branch"
  fi
done
