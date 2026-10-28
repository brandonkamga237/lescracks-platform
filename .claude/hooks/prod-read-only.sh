#!/usr/bin/env bash
# PreToolUse guard for the release-verifier subagent: production is inspected, never changed.
# A denylist cannot prove a command harmless; it stops the mistakes that matter (restarting or
# recreating containers, writing to the database, deleting files, printing secrets).
set -euo pipefail

command="$(jq -r '.tool_input.command // ""')"
lower="$(printf '%s' "$command" | tr '[:upper:]' '[:lower:]')"
# Harmless redirections are removed before looking for a write to a file.
scrubbed="$(printf '%s' "$lower" | sed -E 's#[0-9]?>&[0-9]##g; s#[0-9]?>+ */dev/null##g')"

deny() {
  echo "Blocked by .claude/hooks/prod-read-only.sh: $1. The release verifier only reads production." >&2
  exit 2
}

grep -qE '(^|[^a-z_-])(rm|rmdir|mv|cp|dd|kill|pkill|killall|reboot|shutdown|systemctl|chmod|chown|truncate|tee|crontab|apt|apt-get)([^a-z_-]|$)' <<< "$scrubbed" \
  && deny "file, process or system change"
grep -qE 'docker( container)? +(restart|stop|start|rm|rmi|kill|pull|run|create|update|prune|pause|unpause|cp|commit|tag|push|rename)([^a-z_-]|$)' <<< "$scrubbed" \
  && deny "container change"
# Compose takes options before its subcommand (-f file, -p name): judge each segment on its own.
while IFS= read -r segment; do
  if grep -qE 'docker[ -]compose' <<< "$segment" \
     && ! grep -qE 'docker[ -]compose( +-[a-z-]+( +[^ -][^ ]*)?)* +(ps|logs|config|images|top|ls)([^a-z_-]|$)' <<< "$segment"; then
    deny "compose change"
  fi
done < <(printf '%s\n' "$scrubbed" | tr ';&|' '\n\n\n')
grep -qE 'docker +(system|volume|network|image|builder) ' <<< "$scrubbed" \
  && deny "docker resource change"
grep -qE '(^|[^a-z_])(insert|update|delete|drop|alter|truncate|create|grant|revoke|vacuum|reindex|copy)([^a-z_]|$)' <<< "$scrubbed" \
  && deny "SQL write"
# A write to a file targets a path or a file name; "created_at > now()" in SQL does not.
grep -qE '>+ *(/|~|\.|\$|[a-z0-9_-]+\.[a-z0-9]+)' <<< "$scrubbed" && deny "redirection to a file"
grep -qE '(cat|less|more|head|tail|bat) +[^|;&]*\.env([^a-z]|$)|(^|[^a-z_./-])(env|printenv)([^a-z_.-]|$)' <<< "$scrubbed" \
  && deny "printing secrets"
# Other projects share the machine: a command aimed at one container must aim at a lescracks one.
while IFS= read -r segment; do
  if grep -qE 'docker +(logs|exec|inspect|top|stats|port|diff)([^a-z_-]|$)' <<< "$segment" \
     && ! grep -qE 'lescracks-[a-z0-9_-]+' <<< "$segment"; then
    deny "only the lescracks-* containers are in scope"
  fi
done < <(printf '%s\n' "$scrubbed" | tr ';&|' '\n\n\n')

exit 0
