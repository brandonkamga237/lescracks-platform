# LesCracks — Frontend

Web app of the LesCracks platform.

React, TypeScript, Vite and Tailwind, served by Nginx in production.

## Development

The API must be running on `localhost:8080`.

```bash
pnpm install
pnpm dev         # http://localhost:5173
pnpm typecheck
pnpm lint
pnpm build       # production build in dist/
```

Use pnpm only.

## Configuration

Development runs on defaults. Optional build variables: `VITE_API_BASE_URL` (default
`/api`), `VITE_KEYCLOAK_ISSUER` and `VITE_KEYCLOAK_CLIENT_ID`.
