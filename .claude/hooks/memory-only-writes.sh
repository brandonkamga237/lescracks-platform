#!/usr/bin/env bash
# PreToolUse guard for read-only subagents that keep a memory: enabling `memory` grants Write and
# Edit, and this keeps those tools inside .claude/agent-memory/ so the code itself stays untouched.
set -euo pipefail

path="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')"
memory="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/agent-memory/"
resolved="$(realpath -m -- "$path")"

if [[ "$resolved/" == "$memory"* ]]; then
  exit 0
fi
echo "Blocked by .claude/hooks/memory-only-writes.sh: this agent only reads code; it may write under .claude/agent-memory/ only, not $path." >&2
exit 2
