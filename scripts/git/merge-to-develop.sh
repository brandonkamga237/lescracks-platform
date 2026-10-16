#!/usr/bin/env bash
# Squash-merges a pull request into develop, and only into develop.
# Merging into main stays a human decision: this script refuses any other base branch.
#
# Usage: scripts/git/merge-to-develop.sh <pr-number> [--dry-run]
set -euo pipefail

pr="${1:?usage: merge-to-develop.sh <pr-number> [--dry-run]}"
dry_run="${2:-}"
root="$(git rev-parse --show-toplevel)"

fail() {
  echo "✖ PR #$pr: $1" >&2
  exit 1
}

info="$(gh pr view "$pr" --json baseRefName,state,isDraft,title,body,headRefName,url)"
field() { printf '%s' "$info" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }

base="$(field baseRefName)"
state="$(field state)"
draft="$(field isDraft)"
title="$(field title)"
head="$(field headRefName)"

[[ "$base" == "develop" ]] || fail "targets '$base'. Only PRs into develop can be merged here; merging into main is done by a person."
[[ "$state" == "OPEN" ]] || fail "is $state, not open."
[[ "$draft" == "False" ]] || fail "is a draft."

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
printf '%s\n' "$title" > "$tmp"
"$root/scripts/git/check-commit-msg.sh" "$tmp" || fail "title is not a valid commit header."
field body > "$tmp"
"$root/scripts/git/check-commit-msg.sh" --mentions "$tmp" || fail "description has a forbidden mention."

# gh pr checks exits 0 when every check passed, 8 while some are pending, 1 on a failure.
checks_status=0
gh pr checks "$pr" > /dev/null 2>&1 || checks_status=$?
case "$checks_status" in
  0) ;;
  8) fail "checks are still running; try again once they finish." ;;
  *) fail "checks are failing; see $(field url)/checks" ;;
esac

if [[ "$dry_run" == "--dry-run" ]]; then
  echo "✓ PR #$pr ($head → develop) would be squash-merged as: $title (#$pr)"
  exit 0
fi

gh pr merge "$pr" --squash --delete-branch --subject "$title (#$pr)"
echo "✓ PR #$pr squash-merged into develop: $title (#$pr)"
