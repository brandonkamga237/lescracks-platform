import React from 'react';
import { motion } from 'framer-motion';

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ 
  isLoading, 
  message = "Chargement..." 
}) => {
  if (!isLoading) return null;

  // Animation variants for dots
  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: (i: number) => ({
      scale: [0.8, 1.3, 0.8],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        delay: i * 0.15,
        ease: "easeInOut"
      }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
    >
      <div className="text-center">
        {/* Animated dots */}
        <div className="flex justify-center mb-6 gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              custom={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              className="rounded-full"
              style={{
                width: '14px',
                height: '14px',
                backgroundColor: '#D4AF37',
                boxShadow: '0 0 12px rgba(212, 175, 55, 0.6)'
              }}
            />
          ))}
        </div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-display font-bold text-gold mb-2"
        >
          LesCracks
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-sm"
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default GlobalLoader;
