import { lazy, Suspense, useEffect } from 'react';
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
import Talk from '@/pages/Talk';

// The back office is never part of a visitor's first load: it ships as its own chunk.
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminAudience = lazy(() => import('@/pages/admin/AdminAudience'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
const AdminResources = lazy(() => import('@/pages/admin/AdminResources'));
const AdminNewsletter = lazy(() => import('@/pages/admin/AdminNewsletter'));
const AdminAdmins = lazy(() => import('@/pages/admin/AdminAdmins'));
const AdminTags = lazy(() => import('@/pages/admin/AdminTags'));
const AdminTalks = lazy(() => import('@/pages/admin/AdminTalks'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const ArticleStudio = lazy(() => import('@/pages/admin/ArticleStudio'));
const AdminCrackLab = lazy(() => import('@/pages/admin/AdminCrackLab'));
const CrackLabHome = lazy(() => import('@/pages/cracklab/CrackLabHome'));
const ChallengePage = lazy(() => import('@/pages/cracklab/ChallengePage'));
const CrackLabRanking = lazy(() => import('@/pages/cracklab/Ranking'));
const CrackLabMyProfile = lazy(() => import('@/pages/cracklab/MyProfile'));
const CrackLabMember = lazy(() => import('@/pages/cracklab/MemberProfile'));
const CrackLabResult = lazy(() => import('@/pages/cracklab/PublicResult'));
const AdminCrackLabEditor = lazy(() => import('@/pages/admin/AdminCrackLabEditor'));
const AdminCrackLabQueue = lazy(() => import('@/pages/admin/AdminCrackLabQueue'));
const AdminCrackLabGrade = lazy(() => import('@/pages/admin/AdminCrackLabGrade'));

function Waiting() {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 text-t3">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent motion-reduce:animate-none" />
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
    <button type="button" onClick={() => void reload().catch(() => undefined)} className="mt-6 rounded-full bg-gold-400 px-6 py-3 font-semibold text-black">Réessayer</button>
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
interface AdminRouteProps {
  /** Full-screen tools (the writing studio) bring their own chrome. */
  bare?: boolean;
}

function AdminRoute({ bare = false }: AdminRouteProps) {
  const { isLoading, isSignedIn, isAdmin, error } = useSession();
  const location = useLocation();
  if (isLoading) return <Waiting />;
  if (error) return <SessionFailure />;
  if (!isSignedIn) return <Navigate to={`/admin/connexion?retour=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} replace />;
  if (!isAdmin) return <Navigate to="/ressources" replace />;
  if (bare) return <Suspense fallback={<Waiting />}><Outlet /></Suspense>;
  return <AdminLayout><Suspense fallback={<Waiting />}><Outlet /></Suspense></AdminLayout>;
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
      <Route path="/ressources/articles" element={<Ressources />} />
      <Route path="/ressources/:id" element={<RessourceDetail />} />
      <Route path="/evenements" element={<Evenements />} />
      <Route path="/evenements/:id" element={<EvenementDetail />} />
      <Route path="/talk" element={<Talk />} />
      {/* CrackLab: its own space and chrome, the same accounts. Reading is open; answering needs a member. */}
      <Route path="/cracklab" element={<Suspense fallback={<Waiting />}><CrackLabHome /></Suspense>} />
      <Route path="/cracklab/challenges/:slug" element={<Suspense fallback={<Waiting />}><ChallengePage /></Suspense>} />
      <Route path="/cracklab/classement" element={<Suspense fallback={<Waiting />}><CrackLabRanking /></Suspense>} />
      <Route path="/cracklab/moi" element={<MemberRoute><Suspense fallback={<Waiting />}><CrackLabMyProfile /></Suspense></MemberRoute>} />
      <Route path="/cracklab/mes-reponses" element={<Navigate to="/cracklab/moi" replace />} />
      {/* Public by design: these are the pages a shared link opens. */}
      <Route path="/cracklab/membres/:id" element={<Suspense fallback={<Waiting />}><CrackLabMember /></Suspense>} />
      <Route path="/cracklab/resultats/:id" element={<Suspense fallback={<Waiting />}><CrackLabResult /></Suspense>} />
      <Route path="/a-propos" element={<About />} />
      <Route path="/conditions-utilisation" element={<Terms />} />
      <Route path="/politique-confidentialite" element={<Privacy />} />
      {/* Verifying a code is done by a recruiter who has no account and wants none. */}
      <Route path="/profil" element={<MemberRoute><Profile /></MemberRoute>} />

      <Route path="/admin/articles" element={<AdminRoute bare />}>
        <Route path="nouveau" element={<ArticleStudio />} />
        <Route path=":id" element={<ArticleStudio />} />
      </Route>
      <Route path="/admin" element={<AdminRoute />}>
        <Route index element={<AdminDashboard />} />
        <Route path="audience" element={<AdminAudience />} />
        <Route path="ressources" element={<AdminResources />} />
        <Route path="evenements" element={<AdminEvents />} />
        <Route path="talks" element={<AdminTalks />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="utilisateurs" element={<AdminUsers />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="cracklab" element={<Navigate to="/admin/cracklab/challenges" replace />} />
        <Route path="cracklab/challenges" element={<AdminCrackLab />} />
        <Route path="cracklab/challenges/nouveau" element={<AdminCrackLabEditor />} />
        <Route path="cracklab/challenges/:id" element={<AdminCrackLabEditor />} />
        <Route path="cracklab/reponses" element={<AdminCrackLabQueue />} />
        <Route path="cracklab/reponses/:id" element={<AdminCrackLabGrade />} />
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
