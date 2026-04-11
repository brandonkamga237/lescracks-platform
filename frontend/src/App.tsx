import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalLoader from './components/common/GlobalLoader';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Evenements from './pages/Evenements';
import Ressources from './pages/Ressources';
import OAuthCallback from './pages/OAuthCallback';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTags from './pages/admin/AdminTags';
import AdminResources from './pages/admin/AdminResources';
import AdminEvents from './pages/admin/AdminEvents';
import AdminPremiumRequests from './pages/admin/AdminPremiumRequests';
import AdminApplications from './pages/admin/AdminApplications';
import AdminOpenSource from './pages/admin/AdminOpenSource';
import AdminContributors from './pages/admin/AdminContributors';
import AdminApprenants from './pages/admin/AdminApprenants';
import Apprenants from './pages/Apprenants';
import ApprennantProfile from './pages/ApprennantProfile';
import Premium from './pages/Premium';
import Postuler from './pages/Postuler';
import About from './pages/About';
import OpenSource from './pages/OpenSource';

// Protected Route wrapper for admin
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
};

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/connexion' || location.pathname === '/inscription';

  // Scroll to top on route change
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
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />
          
          {/* Auth Routes */}
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          
          {/* Protected Routes */}
          <Route path="/profil" element={<Profile />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/postuler" element={<Postuler />} />
          
          {/* Public Routes */}
          <Route path="/about" element={<About />} />
          <Route path="/open-source" element={<OpenSource />} />
          <Route path="/evenements" element={<Evenements />} />
          <Route path="/evenements/:id" element={<Evenements />} />
          <Route path="/ressources" element={<Ressources />} />
          <Route path="/apprenants" element={<Apprenants />} />
          <Route path="/apprenants/:slug" element={<ApprennantProfile />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          } />
          <Route path="/admin/tags" element={
            <AdminRoute>
              <AdminTags />
            </AdminRoute>
          } />
          <Route path="/admin/resources" element={
            <AdminRoute>
              <AdminResources />
            </AdminRoute>
          } />
          <Route path="/admin/events" element={
            <AdminRoute>
              <AdminEvents />
            </AdminRoute>
          } />
          <Route path="/admin/applications" element={
            <AdminRoute>
              <AdminApplications />
            </AdminRoute>
          } />
          <Route path="/admin/premium-requests" element={
            <AdminRoute>
              <AdminPremiumRequests />
            </AdminRoute>
          } />
          <Route path="/admin/open-source" element={
            <AdminRoute>
              <AdminOpenSource />
            </AdminRoute>
          } />
          <Route path="/admin/contributors" element={
            <AdminRoute>
              <AdminContributors />
            </AdminRoute>
          } />
          <Route path="/admin/apprenants" element={
            <AdminRoute>
              <AdminApprenants />
            </AdminRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <GlobalLoader
            isLoading={isLoading}
            message="Chargement de LesCracks..."
          />
          
          {!isLoading && (
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
              <AppContent />
            </div>
          )}
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
