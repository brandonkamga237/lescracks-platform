// src/components/ui/OffsetSection.tsx
import { motion } from 'framer-motion';

interface OffsetSectionProps {
  children: React.ReactNode;
  className?: string;
  offset?: number; // percentage offset from default
  direction?: 'left' | 'right' | 'center';
  background?: 'black' | 'dark' | 'transparent';
}

export const OffsetSection: React.FC<OffsetSectionProps> = ({
  children,
  className = '',
  offset = 0,
  direction = 'left',
  background = 'transparent',
}) => {
  const backgroundClasses = {
    black: 'bg-black',
    dark: 'bg-[#0a0a0a]',
    transparent: 'bg-transparent',
  };

  const getTransform = () => {
    if (direction === 'left') return `translateX(-${offset}%)`;
    if (direction === 'right') return `translateX(${offset}%)`;
    return 'translateX(0)';
  };

  return (
    <section className={`w-[120%] ${backgroundClasses[background]} ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ transform: getTransform() }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {children}
      </motion.div>
    </section>
  );
};

// Offset card with overlap effect
export const OffsetCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  overlap?: number;
  direction?: 'forward' | 'back';
}> = ({
  children,
  className = '',
  overlap = 0,
  direction = 'forward',
}) => {
  const transform = direction === 'forward' 
    ? `translateX(${overlap}px)` 
    : `translateX(-${overlap}px)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
      style={{ transform }}
    >
      {children}
    </motion.div>
  );
};

// Diagonal divider
export const DiagonalDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative h-32 overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-black via-gold/20 to-black transform -skew-y-3" />
  </div>
);

export default OffsetSection;
