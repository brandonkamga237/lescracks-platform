import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

import { SessionContext } from '@/hooks/useSession';
import type { SessionIdentity } from '@/hooks/useSession';
import { api } from '@/services/api';
import { adminApi } from '@/services/adminApi';
import { currentAccessToken, safeReturnPath } from '@/services/auth';
import { ApiError, getAuthTransport, setAuthTransport } from '@/services/http';
import type { UserProfile } from '@/services/types';

const anonymous: SessionIdentity = { isSignedIn: false, isAdmin: false, name: null, email: null, user: null };

function unavailable(cause: unknown): Error {
  return cause instanceof ApiError ? cause : new Error('Impossible de joindre le serveur. Vérifie ta connexion, puis réessaie.');
}

function isMissingIdentity(cause: unknown) {
  return cause instanceof ApiError && [401, 403, 404].includes(cause.status);
}

interface OidcProfile {
  name?: string;
  preferred_username?: string;
  email?: string;
}

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const auth = useAuth();
  const authRef = useRef(auth);
  authRef.current = auth;
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<SessionIdentity>(anonymous);
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const revision = useRef(0);

  const reload = useCallback(async () => {
    const hasOidcIdentity = (profile: UserProfile, provider: string | null) =>
      !!provider && profile.identities?.some((identity) => identity.provider === provider.toUpperCase());

    const syncOidcProfile = async (provider: 'google' | 'github', oidcProfile: OidcProfile | null | undefined) => {
      try {
        const profile = await api.syncOidc(provider);
        sessionStorage.removeItem('lescracks.oidc.provider');
        setIdentity({ isSignedIn: true, isAdmin: false, user: profile, name: `${profile.firstName} ${profile.lastName}`.trim(), email: profile.email });
      } catch (cause) {
        setIdentity({ ...anonymous, isSignedIn: true, name: oidcProfile?.name ?? oidcProfile?.preferred_username ?? null, email: oidcProfile?.email ?? null });
        setError(unavailable(cause));
      }
    };

    const requestId = ++revision.current;
    if (!identityRef.current.isSignedIn) setLoading(true);
    setError(null);
    try {
      const probe = () => Promise.allSettled([api.me(), adminApi.me()] as const);
      let mode = getAuthTransport();
      let results = await probe();
      const noCookie = results.every((result) => result.status === 'rejected' && isMissingIdentity(result.reason));
      if (mode === 'cookie' && noCookie && !sessionStorage.getItem('lescracks.auth.transport') && currentAccessToken()) {
        mode = 'oidc';
        setAuthTransport(mode);
        results = await probe();
      }
      if (requestId !== revision.current) return;
      const [member, admin] = results;
      if (admin.status === 'fulfilled' && admin.value.role === 'ADMIN') {
        setIdentity({ ...anonymous, isSignedIn: true, isAdmin: true, name: admin.value.username });
      } else if (admin.status === 'rejected' && !isMissingIdentity(admin.reason)) {
        throw admin.reason;
      } else if (member.status === 'fulfilled' && typeof member.value.id === 'number' && typeof member.value.email === 'string') {
        const profile = member.value;
        const oidcProvider = sessionStorage.getItem('lescracks.oidc.provider');
        if (mode === 'oidc' && currentAccessToken() && oidcProvider && (oidcProvider === 'google' || oidcProvider === 'github') && !hasOidcIdentity(profile, oidcProvider)) {
          await syncOidcProfile(oidcProvider, authRef.current.user?.profile);
        } else {
          setIdentity({ isSignedIn: true, isAdmin: false, user: profile, name: `${profile.firstName} ${profile.lastName}`.trim(), email: profile.email });
        }
      } else {
        const failed = results.find((result) => result.status === 'rejected' && !isMissingIdentity(result.reason));
        if (failed?.status === 'rejected') throw failed.reason;
        if (results.some((result) => result.status === 'fulfilled')) throw new ApiError(502, { message: 'Le serveur a renvoyé une session invalide.' });
        const oidcProfile = authRef.current.user?.profile;
        const missingLocalProfile = member.status === 'rejected' && member.reason instanceof ApiError && member.reason.status === 404;
        const oidcProvider = sessionStorage.getItem('lescracks.oidc.provider');
        if (mode === 'oidc' && currentAccessToken() && missingLocalProfile && oidcProvider && (oidcProvider === 'google' || oidcProvider === 'github') && oidcProfile) {
          await syncOidcProfile(oidcProvider, oidcProfile);
        } else {
          setIdentity(anonymous);
        }
      }
      if (mode === 'cookie' && !noCookie) {
        setAuthTransport('cookie');
        authRef.current.stopSilentRenew();
      }
    } catch (cause) {
      if (requestId !== revision.current) return;
      const failure = unavailable(cause);
      setError(failure);
      throw failure;
    } finally {
      if (requestId === revision.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.isLoading) return;
    void reload().catch(() => undefined);
  }, [auth.isLoading, auth.user?.access_token, reload]);

  useEffect(() => {
    const refresh = () => { void reload().catch(() => undefined); };
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('lescracks:session-expired', refresh);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('lescracks:session-expired', refresh);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload]);

  const cookieLogin = async (action: () => Promise<unknown>, verify = () => api.me() as Promise<unknown>) => {
    try {
      await action();
      setAuthTransport('cookie');
      authRef.current.stopSilentRenew();
      await authRef.current.removeUser();
      await verify();
      await reload();
    } catch (cause) {
      throw unavailable(cause);
    }
  };

  const currentPath = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const openAuth = (path: string, returnTo?: string) => navigate(`${path}?retour=${encodeURIComponent(safeReturnPath(returnTo ?? currentPath()))}`);

  const signOut = async () => {
    const mode = getAuthTransport();
    const idToken = authRef.current.user?.id_token;
    try {
      if (identity.isAdmin) await adminApi.logout();
      else await api.logout();
      ++revision.current;
      setAuthTransport('cookie');
      authRef.current.stopSilentRenew();
      await authRef.current.removeUser();
      setIdentity(anonymous);
      setLoading(false);
      setError(null);
      if (mode === 'oidc') await authRef.current.signoutRedirect({ id_token_hint: idToken });
    } catch (cause) {
      const failure = unavailable(cause);
      setError(failure);
      throw failure;
    }
  };

  const socialSignIn = async (provider: 'google' | 'github', returnTo?: string) => {
    const previousMode = getAuthTransport();
    setAuthTransport('oidc');
    authRef.current.startSilentRenew();
    try {
      sessionStorage.setItem('lescracks.oidc.provider', provider);
      await authRef.current.signinRedirect({
        state: { from: safeReturnPath(returnTo ?? currentPath()) },
        extraQueryParams: { kc_idp_hint: provider },
      });
    } catch (cause) {
      setAuthTransport(previousMode);
      if (previousMode === 'cookie') authRef.current.stopSilentRenew();
      throw unavailable(cause);
    }
  };

  return <SessionContext.Provider value={{
    ...identity, isLoading, error, reload, refresh: reload,
    signIn: (returnTo) => openAuth('/connexion', returnTo),
    register: (returnTo) => openAuth('/inscription', returnTo),
    signOut,
    login: (email, password) => cookieLogin(() => api.login(email, password)),
    createAccount: async (body) => { await api.register(body); },
    loginAdmin: (username, password) => cookieLogin(() => adminApi.login(username, password), () => adminApi.me()),
    socialSignIn,
  }}>{children}</SessionContext.Provider>;
}
