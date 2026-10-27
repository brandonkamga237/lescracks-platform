import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { rememberArrival } from '@/lib/arrival';
import { useSession } from '@/hooks/useSession';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthCallback from '@/pages/AuthCallback';
import AuthPage, { ResetPasswordPage } from '@/pages/AuthPage';
import AdminLogin from '@/pages/AdminLogin';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/NotFound';

// Only the landing page and sign-in ship in the first load; each other page is its own chunk,
// so a visitor reading one article never downloads the code highlighter for the whole site.
const About = lazy(() => import('@/pages/About'));
const EvenementDetail = lazy(() => import('@/pages/EvenementDetail'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const Unsubscribe = lazy(() => import('@/pages/Unsubscribe'));
const NewsletterConfirm = lazy(() => import('@/pages/NewsletterConfirm'));
const Evenements = lazy(() => import('@/pages/Evenements'));
const Profile = lazy(() => import('@/pages/Profile'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const Formations = lazy(() => import('@/pages/Formations'));
const Talk = lazy(() => import('@/pages/Talk'));

// The back office is never part of a visitor's first load: it ships as its own chunk.
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminAudience = lazy(() => import('@/pages/admin/AdminAudience'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
const AdminEventParticipants = lazy(() => import('@/pages/admin/AdminEventParticipants'));
const AdminBadges = lazy(() => import('@/pages/admin/AdminBadges'));
const AdminComments = lazy(() => import('@/pages/admin/AdminComments'));
const Attestation = lazy(() => import('@/pages/Attestation'));
const MemberProfile = lazy(() => import('@/pages/MemberProfile'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminNewsletter = lazy(() => import('@/pages/admin/AdminNewsletter'));
const AdminAdmins = lazy(() => import('@/pages/admin/AdminAdmins'));
const AdminTags = lazy(() => import('@/pages/admin/AdminTags'));
const AdminTalks = lazy(() => import('@/pages/admin/AdminTalks'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const ArticleStudio = lazy(() => import('@/pages/admin/ArticleStudio'));
const Welcome = lazy(() => import('@/pages/Welcome'));

function Waiting() {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 text-t3">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent motion-reduce:animate-none" />
      <p>Vérification de ta session…</p>
    </div>
  );
}

function PageLoading() {
  return (
    <div role="status" aria-label="Chargement" className="flex min-h-screen items-center justify-center">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent motion-reduce:animate-none" />
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
    <Link to="/blog" className="mt-4 text-sm text-t2 underline">Lire le blog</Link>
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
  if (!isAdmin) return <Navigate to="/blog" replace />;
  if (bare) return <Suspense fallback={<Waiting />}><Outlet /></Suspense>;
  return <AdminLayout><Suspense fallback={<Waiting />}><Outlet /></Suspense></AdminLayout>;
}

// Pages where the welcome questions must not interrupt: signing in, legal reading, the welcome itself.
const WELCOME_EXEMPT = ['/bienvenue', '/desabonnement', '/newsletter/confirmer', '/auth/callback', '/connexion', '/inscription', '/reinitialiser', '/verifier-email', '/conditions-utilisation', '/politique-confidentialite', '/admin'];

function AppRoutes() {
  const location = useLocation();
  const { isSignedIn, isAdmin, user } = useSession();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => { rememberArrival(`${location.pathname}${location.search}`, location.search); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once after sign-up, whatever the way in: the welcome questions, then back where the member was going.
  if (isSignedIn && !isAdmin && user?.onboardingRequired && !WELCOME_EXEMPT.some((path) => location.pathname.startsWith(path))) {
    return <Navigate to={`/bienvenue?retour=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  return (
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/connexion" element={<AuthPage mode="login" />} />
      <Route path="/inscription" element={<AuthPage mode="register" />} />
      <Route path="/reinitialiser" element={<ResetPasswordPage />} />
      <Route path="/verifier-email" element={<VerifyEmail />} />
      <Route path="/desabonnement" element={<Unsubscribe />} />
      <Route path="/newsletter/confirmer" element={<NewsletterConfirm />} />
      <Route path="/admin/connexion" element={<AdminLogin />} />

      {/* Reading is what brings people in; asking them to sign up first is what keeps
              them out. Everything below is open. */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/formations" element={<Formations />} />
      {/* The library became the blog: links already shared keep working. */}
      <Route path="/ressources" element={<Navigate to="/blog" replace />} />
      <Route path="/ressources/:slug" element={<LegacyArticle />} />
      <Route path="/evenements" element={<Evenements />} />
      <Route path="/evenements/:id" element={<EvenementDetail />} />
      <Route path="/attestations/:code" element={<Suspense fallback={<Waiting />}><Attestation /></Suspense>} />
      <Route path="/membres/:id" element={<Suspense fallback={<Waiting />}><MemberProfile /></Suspense>} />
      <Route path="/talk" element={<Talk />} />
      <Route path="/cracklab/*" element={<Navigate to="/" replace />} />
      <Route path="/a-propos" element={<About />} />
      <Route path="/conditions-utilisation" element={<Terms />} />
      <Route path="/politique-confidentialite" element={<Privacy />} />
      {/* Verifying a code is done by a recruiter who has no account and wants none. */}
      <Route path="/bienvenue" element={<MemberRoute><Suspense fallback={<Waiting />}><Welcome /></Suspense></MemberRoute>} />
      <Route path="/profil" element={<MemberRoute><Profile /></MemberRoute>} />

      <Route path="/admin/articles" element={<AdminRoute bare />}>
        <Route path="nouveau" element={<ArticleStudio />} />
        <Route path=":id" element={<ArticleStudio />} />
      </Route>
      <Route path="/admin" element={<AdminRoute />}>
        <Route index element={<AdminDashboard />} />
        <Route path="audience" element={<AdminAudience />} />
        <Route path="blog" element={<AdminBlog />} />
        <Route path="ressources" element={<Navigate to="/admin/blog" replace />} />
        <Route path="evenements" element={<AdminEvents />} />
        <Route path="evenements/:id" element={<AdminEventParticipants />} />
        <Route path="badges" element={<AdminBadges />} />
        <Route path="commentaires" element={<AdminComments />} />
        <Route path="talks" element={<AdminTalks />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="utilisateurs" element={<AdminUsers />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

/** /ressources/videos, /ressources/ebooks and /ressources/articles were listings; anything else was an article. */
function LegacyArticle() {
  const { slug = '' } = useParams();
  const listing = ['ebooks', 'videos', 'articles'].includes(slug);
  return <Navigate to={listing ? '/blog' : `/blog/${slug}`} replace />;
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
