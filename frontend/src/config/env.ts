export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',

  // Keycloak owns identity: passwords, Google, GitHub, reset and login throttling.
  // Nothing here is secret — a public client proves itself with PKCE, not with a key.
  KEYCLOAK_ISSUER:
    import.meta.env.VITE_KEYCLOAK_ISSUER || 'http://localhost:8081/realms/lescracks',
  KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'lescracks-frontend',

  MODE: import.meta.env.MODE as 'development' | 'production',
  IS_PROD: import.meta.env.PROD as boolean,
  IS_DEV: import.meta.env.DEV as boolean,
} as const;

export default ENV;
