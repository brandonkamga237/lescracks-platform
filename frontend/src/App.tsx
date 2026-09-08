import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { useSession } from '@/hooks/useSession';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthCallback from '@/pages/AuthCallback';
import AuthPage, { ResetPasswordPage } from '@/pages/AuthPage';
import AdminLogin from '@/pages/AdminLogin';

import About from '@/pages/About';
import EvenementDetail from '@/pages/EvenementDetail';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import VerifyEmail from '@/pages/VerifyEmail';
import Evenements from '@/pages/Evenements';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import RessourceDetail from '@/pages/RessourceDetail';
import Ressources from '@/pages/Ressources';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminResources from '@/pages/admin/AdminResources';
import AdminTags from '@/pages/admin/AdminTags';
import AdminUsers from '@/pages/admin/AdminUsers';

function Waiting() {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 text-t3">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent motion-reduce:animate-none" />
      <p>Vérification de ta session…</p>
    </div>
  );
}

function SessionFailure() {
  const { error, reload } = useSession();
  return <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 text-center">
    <h1 className="font-display text-3xl text-t1">Ta session est indisponible</h1>
    <p role="alert" className="mt-4 text-t3">{error?.message}</p>
    <p className="mt-3 text-sm text-t4">Un problème de serveur ne signifie pas que tu es déconnecté.</p>
    <button type="button" onClick={() => void reload().catch(() => undefined)} className="mt-6 rounded-full bg-[#d4af37] px-6 py-3 font-semibold text-black">Réessayer</button>
    <Link to="/ressources" className="mt-4 text-sm text-t2 underline">Explorer les ressources publiques</Link>
  </div>;
}

interface MemberRouteProps {
  children: ReactNode;
}

/** Signed in or not, everyone may read the catalogue; only the door differs. */
function MemberRoute({ children }: MemberRouteProps) {
  const { isLoading, isSignedIn, error } = useSession();
  const location = useLocation();
  if (isLoading) return <Waiting />;
  if (error) return <SessionFailure />;
  if (!isSignedIn) return <Navigate to={`/connexion?retour=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} state={{ expired: true }} replace />;
  return <>{children}</>;
}

/**
 * A non-admin lands on the catalogue rather than on a refusal: they did nothing wrong,
 * they simply followed a link that was not for them.
 */
function AdminRoute() {
  const { isLoading, isSignedIn, isAdmin, error } = useSession();
  const location = useLocation();
  if (isLoading) return <Waiting />;
  if (error) return <SessionFailure />;
  if (!isSignedIn) return <Navigate to={`/admin/connexion?retour=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} replace />;
  if (!isAdmin) return <Navigate to="/ressources" replace />;
  return <AdminLayout><Outlet /></AdminLayout>;
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/connexion" element={<AuthPage mode="login" />} />
      <Route path="/inscription" element={<AuthPage mode="register" />} />
      <Route path="/reinitialiser" element={<ResetPasswordPage />} />
      <Route path="/verifier-email" element={<VerifyEmail />} />
      <Route path="/admin/connexion" element={<AdminLogin />} />

      {/* Reading is what brings people in; asking them to sign up first is what keeps
              them out. Everything below is open. */}
      <Route path="/ressources" element={<Ressources />} />
      <Route path="/ressources/ebooks" element={<Ressources />} />
      <Route path="/ressources/videos" element={<Ressources />} />
      <Route path="/ressources/:id" element={<RessourceDetail />} />
      <Route path="/evenements" element={<Evenements />} />
      <Route path="/evenements/:id" element={<EvenementDetail />} />
      <Route path="/a-propos" element={<About />} />
      <Route path="/conditions-utilisation" element={<Terms />} />
      <Route path="/politique-confidentialite" element={<Privacy />} />
      {/* Verifying a code is done by a recruiter who has no account and wants none. */}
      <Route path="/profil" element={<MemberRoute><Profile /></MemberRoute>} />

      <Route path="/admin" element={<AdminRoute />}>
        <Route index element={<AdminDashboard />} />
        <Route path="ressources" element={<AdminResources />} />
        <Route path="evenements" element={<AdminEvents />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="utilisateurs" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    /*
      reducedMotion="user" makes every framer-motion animation honour the OS setting. The
      CSS media query alone cannot: framer animates through inline styles it sets itself.
    */
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <AppRoutes />
        </div>
      </ThemeProvider>
    </MotionConfig>
  );
}
