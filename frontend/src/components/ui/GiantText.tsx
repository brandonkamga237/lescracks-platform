// src/components/ui/GiantText.tsx
import { motion } from 'framer-motion';

interface GiantTextProps {
  children: React.ReactNode;
  className?: string;
  offset?: number; // percentage offset from left
  color?: 'white' | 'gold' | 'gradient';
}

export const GiantText: React.FC<GiantTextProps> = ({
  children,
  className = '',
  offset = 0,
  color = 'white',
}) => {
  const colorClasses = {
    white: 'text-white',
    gold: 'text-gold',
    gradient: 'text-gradient-gold',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={className}
      style={{ marginLeft: `${offset}%` }}
    >
      <h1
        className={`font-display font-bold leading-[0.85] tracking-tight ${colorClasses[color]}`}
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        {children}
      </h1>
    </motion.div>
  );
};

export default GiantText;
