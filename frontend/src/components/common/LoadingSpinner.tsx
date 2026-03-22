import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  fullScreen = false 
}) => {
  const sizeConfig = {
    sm: { dots: 3, spacing: 4, container: 16 },
    md: { dots: 3, spacing: 6, container: 24 },
    lg: { dots: 3, spacing: 8, container: 32 },
    xl: { dots: 3, spacing: 10, container: 48 }
  };

  const config = sizeConfig[size];

  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: (i: number) => ({
      scale: [0.8, 1.2, 0.8],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1,
        repeat: Infinity,
        delay: i * 0.2,
        ease: "easeInOut"
      }
    })
  };

  const spinner = (
    <div className={`flex items-center justify-center ${fullScreen ? 'flex-col' : 'gap-2'}`}>
      <div 
        className="flex items-center"
        style={{ gap: `${config.spacing}px` }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            className="rounded-full"
            style={{
              width: `${config.spacing + 2}px`,
              height: `${config.spacing + 2}px`,
              backgroundColor: '#D4AF37', // gold color
              boxShadow: '0 0 8px rgba(212, 175, 55, 0.5)'
            }}
          />
        ))}
      </div>
      
      {text && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${
            size === 'sm' ? 'text-sm' : 
            size === 'md' ? 'text-base' : 
            size === 'lg' ? 'text-lg' : 'text-xl'
          } text-gold font-medium ${fullScreen ? 'mt-4' : ''}`}
        >
          {text}
        </motion.span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className="flex flex-col items-center">
          {spinner}
        </div>
      </motion.div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
