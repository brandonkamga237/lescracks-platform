#!/usr/bin/env bash
# Validates a commit message (or a pull request title / body) against the repository rules.
# One script for the local commit-msg hook and for CI, so both enforce exactly the same thing.
#
# Usage:
#   scripts/git/check-commit-msg.sh <file>              full check: header format + forbidden mentions
#   scripts/git/check-commit-msg.sh --mentions <file>   forbidden mentions only (a PR body)
set -euo pipefail

mode="full"
if [[ "${1:-}" == "--mentions" ]]; then
  mode="mentions"
  shift
fi
file="${1:?usage: check-commit-msg.sh [--mentions] <file>}"

# Drop git's comment lines and everything below the scissors line of `commit -v`.
message="$(sed -e '/^# -\{24\} >8 -\{24\}$/,$d' -e '/^#/d' "$file")"

fail() {
  echo "✖ $1" >&2
  echo "  See CONTRIBUTING.md (Commit messages)." >&2
  exit 1
}

# No mention of Claude, Anthropic or any generation tool, anywhere in the message.
# The file name CLAUDE.md and the .claude/ directory are the only allowed occurrences.
scrubbed="$(printf '%s' "$message" | sed -E 's/CLAUDE\.md//g; s#\.claude/##g')"
if printf '%s' "$scrubbed" | grep -qiE 'claude|anthropic|generated with|co-authored-by:.*noreply@|🤖'; then
  fail "Commit messages must not mention Claude, Anthropic, AI or a generation tool (trailer, signature or text)."
fi

[[ "$mode" == "mentions" ]] && exit 0

header="$(printf '%s\n' "$message" | sed -n '/[^[:space:]]/{p;q;}')"
[[ -n "$header" ]] || fail "Empty commit message."

# Lines git writes itself are accepted as they are.
if [[ "$header" =~ ^(Merge\ |Revert\ \"|fixup!\ |squash!\ |amend!\ ) ]]; then
  exit 0
fi

pattern='^(feat|fix|perf|refactor|docs|test|build|ci|chore|style|revert)(\([a-z0-9][a-z0-9-]*\))?!?: [^[:space:]].*$'
if ! [[ "$header" =~ $pattern ]]; then
  fail "Header must read 'type(scope): description' — got: $header
  type: feat | fix | perf | refactor | docs | test | build | ci | chore | style | revert
  scope (optional): lowercase, e.g. identity, cracklab, ci"
fi

if (( ${#header} > 100 )); then
  fail "Header is ${#header} characters; keep it at 100 or fewer."
fi
