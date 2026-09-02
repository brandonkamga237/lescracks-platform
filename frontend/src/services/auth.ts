import { User, WebStorageStateStore } from 'oidc-client-ts';
import type { AuthProviderProps } from 'react-oidc-context';

import { ENV } from '@/config/env';

/**
 * Keycloak configuration for the browser.
 *
 * There is no login form, no password field and no reset flow in this codebase any more:
 * signing in is a redirect to the realm, and adding Google or GitHub is realm configuration
 * that changes nothing here.
 */
export const oidcConfig: AuthProviderProps = {
  authority: ENV.KEYCLOAK_ISSUER,
  client_id: ENV.KEYCLOAK_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',

  // Session storage rather than local: closing the tab ends the session, and a token that
  // outlives the tab it was issued in is a token nobody remembers granting.
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // Renewed in a hidden iframe before it expires, so a long read is never interrupted by a
  // redirect the reader did not ask for.
  automaticSilentRenew: true,

  // The callback lands on a route of ours; clearing it keeps the code out of history.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

/** Where oidc-client-ts keeps the session, so the api client can read the token it holds. */
const storageKey = `oidc.user:${ENV.KEYCLOAK_ISSUER}:${ENV.KEYCLOAK_CLIENT_ID}`;

/**
 * The access token, or null when nobody is signed in.
 *
 * Read at call time rather than captured: a renewed token must be picked up without the
 * caller knowing a renewal happened.
 */
export function currentAccessToken(): string | null {
  const stored = sessionStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    const user = User.fromStorageString(stored);
    return user.expired ? null : user.access_token;
  } catch {
    return null;
  }
}

/** Realm roles, read from the token rather than from anything the client could set. */
export function rolesOf(user: User | null | undefined): string[] {
  const claims = user?.profile as { realm_access?: { roles?: string[] } } | undefined;
  return claims?.realm_access?.roles ?? [];
}

export function isAdmin(user: User | null | undefined): boolean {
  return rolesOf(user).includes('admin');
}
