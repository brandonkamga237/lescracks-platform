import { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { useSession } from '@/hooks/useSession';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthCallback from '@/pages/AuthCallback';

import About from '@/pages/About';
import Attestation from '@/pages/Attestation';
import EvenementDetail from '@/pages/EvenementDetail';
import Evenements from '@/pages/Evenements';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/NotFound';
import Postuler from '@/pages/Postuler';
import Profile from '@/pages/Profile';
import Programme from '@/pages/Programme';
import RessourceDetail from '@/pages/RessourceDetail';
import Ressources from '@/pages/Ressources';

import AdminApplications from '@/pages/admin/AdminApplications';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminParticipations from '@/pages/admin/AdminParticipations';
import AdminResources from '@/pages/admin/AdminResources';
import AdminTags from '@/pages/admin/AdminTags';

function Waiting() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
    </div>
  );
}

/** Signed in or not, everyone may read the catalogue; only the door differs. */
function MemberRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isSignedIn, signIn } = useSession();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isSignedIn) void signIn();
  }, [isLoading, isSignedIn, signIn, location.pathname]);

  if (isLoading || !isSignedIn) return <Waiting />;
  return <>{children}</>;
}

/**
 * A non-admin lands on the catalogue rather than on a refusal: they did nothing wrong,
 * they simply followed a link that was not for them.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isSignedIn, isAdmin, signIn } = useSession();

  useEffect(() => {
    if (!isLoading && !isSignedIn) void signIn();
  }, [isLoading, isSignedIn, signIn]);

  if (isLoading || !isSignedIn) return <Waiting />;
  if (!isAdmin) return <Navigate to="/ressources" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Reading is what brings people in; asking them to sign up first is what keeps
              them out. Everything below is open. */}
          <Route path="/ressources" element={<Ressources />} />
          <Route path="/ressources/:slug" element={<RessourceDetail />} />
          <Route path="/evenements" element={<Evenements />} />
          <Route path="/evenements/:slug" element={<EvenementDetail />} />
          <Route path="/programme" element={<Programme />} />
          <Route path="/postuler" element={<Postuler />} />
          <Route path="/about" element={<About />} />

          {/* Verifying a code is done by a recruiter who has no account and wants none. */}
          <Route path="/attestations/:code" element={<Attestation />} />

          <Route path="/profil" element={<MemberRoute><Profile /></MemberRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminResources /></AdminRoute>} />
          <Route path="/admin/ressources" element={<AdminRoute><AdminResources /></AdminRoute>} />
          <Route path="/admin/evenements" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/candidatures" element={<AdminRoute><AdminApplications /></AdminRoute>} />
          <Route path="/admin/participations" element={<AdminRoute><AdminParticipations /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/tags" element={<AdminRoute><AdminTags /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <AppRoutes />
          </div>
        </Router>
      </ThemeProvider>
    </MotionConfig>
  );
}
