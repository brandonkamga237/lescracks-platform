import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const AsymmetricHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center min-h-screen overflow-hidden"
      style={{
        backgroundImage: 'url(/images/hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`absolute inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'}`} />

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

      {/* Decorative elements */}
      <motion.div
        className="absolute left-8 top-1/2 -translate-y-1/2 w-px h-[50vh] bg-gradient-to-b from-gold via-gold/50 to-transparent hidden lg:block"
        style={{ scaleY: scrollYProgress, transformOrigin: 'top' }}
      />

      {/* Main content */}
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 w-full  z-10">
        <motion.div style={{ y, opacity }} className=" flex justify-center w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10 text-center max-w-3xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gold uppercase tracking-[0.5em] mt-4 mb-2"
            >
              Excellence en formation tech
            </motion.p>

            <h1 className="text-6xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-tight mb-4">
              <span>Devenez </span>
              <span className="relative inline-block text-gold">
  un crack
  <svg
    className="absolute -bottom-2 left-0 w-full"
    viewBox="0 0 200 20"
    preserveAspectRatio="none"
  >
    <path
      d="M0 15 Q100 25 200 15"
      stroke="#D4AF37"
      strokeWidth="4"
      fill="transparent"
      strokeLinecap="round"
    />
  </svg>
</span>
              <br />
              <span>de la Tech</span>
            </h1>

            <p className={`text-xl max-w-xl mx-auto mb-10 ${isDark ? 'text-white/50' : 'text-white/70'}`}>
              Programme intensif pour transformer votre potentiel en expertise concrete.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link
                to="/inscription"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gold text-black font-semibold text-lg hover:bg-gold-light transition-colors"
              >
                Postuler maintenant
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to="/evenements"
                className={`inline-flex items-center justify-center gap-2 px-10 py-5 border hover:border-gold/30 transition-colors text-lg ${
                  isDark 
                    ? 'border-white/10 text-white/60 hover:text-white' 
                    : 'border-black/30 text-black/70 hover:text-black'
                }`}
              >
                Decouvrir
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className={`text-[10px] tracking-widest ${isDark ? 'text-white/30' : 'text-black/40'}`}>SCROLL</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-4 bg-gradient-to-b from-gold to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default AsymmetricHero;
