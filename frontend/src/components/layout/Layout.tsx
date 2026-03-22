// src/components/layout/Layout.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import { ArrowUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showScrollTop?: boolean;
  showFooter?: boolean;
}

const Layout = ({ children, showScrollTop = true, showFooter = true }: LayoutProps) => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground custom-scrollbar theme-transition">
      {/* Header / Navigation */}
      <Header />

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showScrollToTop ? 1 : 0,
            y: showScrollToTop ? 0 : 20,
            pointerEvents: showScrollToTop ? 'auto' : 'none'
          }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-gold text-black flex items-center justify-center shadow-lg hover:bg-gold-light transition-colors"
          aria-label="Remonter en haut"
        >
          <ArrowUp className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
};

export default Layout;
