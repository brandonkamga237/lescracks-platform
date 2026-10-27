# feature-builder memory

Build traps met in this repository. One line per fact.

- The commit hook refuses any mention of "claude" except the exact strings `CLAUDE.md` and `.claude/`: use the `(tooling)` scope for `.claude/` changes
- Docker is often stopped on the maintainer's machine: `./mvnw verify` (the `*IT` suite) then only runs in CI; say so instead of claiming it passed
- `./mvnw -o` works offline once dependencies are cached
- `gh pr merge` and pushes to `main`/`develop` are denied; merging into develop is `scripts/git/merge-to-develop.sh <pr>`, only when the caller asks
- Constructors of `AccountDirectoryImpl`, `AccountSettingsServiceImpl` and `AccountAdminServiceImpl` take `AccountEvents`: tests pass `mock(AccountEvents.class)`
- Frontend pages are `React.lazy` imports in `App.tsx`; the bundle size is printed by `pnpm build`
