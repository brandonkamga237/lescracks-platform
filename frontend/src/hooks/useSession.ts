import { useAuth } from 'react-oidc-context';

import { isAdmin } from '@/services/auth';

/**
 * Who is reading, in the terms screens actually ask in.
 *
 * Wrapping react-oidc-context rather than calling it everywhere keeps the identity library
 * behind one file: pages ask "is this an admin", not "what does realm_access contain".
 */
export function useSession() {
  const auth = useAuth();

  return {
    isLoading: auth.isLoading,
    isSignedIn: auth.isAuthenticated,
    isAdmin: isAdmin(auth.user),
    name: auth.user?.profile.name ?? auth.user?.profile.preferred_username ?? null,
    email: auth.user?.profile.email ?? null,

    /** Sends the reader to the realm; they come back where they left off. */
    signIn: () => auth.signinRedirect({ state: { from: window.location.pathname } }),

    /** Registration is a realm screen too, reached by asking Keycloak for it directly. */
    register: () =>
      auth.signinRedirect({ extraQueryParams: { kc_action: 'register' } }),

    signOut: () => auth.signoutRedirect(),
  };
}

export default useSession;
