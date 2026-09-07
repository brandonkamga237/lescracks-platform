import { createContext, useContext } from 'react';

import type { RegisterRequest } from '@/services/api';
import type { UserProfile } from '@/services/types';

export interface SessionIdentity {
  isSignedIn: boolean;
  isAdmin: boolean;
  name: string | null;
  email: string | null;
  user: UserProfile | null;
}

export interface SessionContextValue extends SessionIdentity {
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  signIn: (returnTo?: string) => void;
  register: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  createAccount: (body: RegisterRequest) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  socialSignIn: (provider: 'google' | 'github', returnTo?: string) => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Who is reading, in the terms screens actually ask in.
 *
 * Wrapping react-oidc-context rather than calling it everywhere keeps the identity library
 * behind one file: pages ask "is this an admin", not "what does realm_access contain".
 */
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within SessionProvider');

  return {
    ...session,
    /** Sends the reader to the realm; they come back where they left off. */
    socialSignIn: session.socialSignIn,
    /** Registration is a realm screen too, reached by asking Keycloak for it directly. */
    register: session.register,
  };
}

export default useSession;
