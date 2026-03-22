// src/components/ui/GeometricShape.tsx
import { motion } from 'framer-motion';

interface GeometricShapeProps {
  type: 'circle' | 'rectangle' | 'line';
  size?: number;
  className?: string;
  position?: { top?: string; bottom?: string; left?: string; right?: string };
  color?: 'gold' | 'white' | 'dark';
  animate?: boolean;
}

export const GeometricShape: React.FC<GeometricShapeProps> = ({
  type,
  size = 200,
  className = '',
  position = {},
  color = 'gold',
  animate = false,
}) => {
  const colorClasses = {
    gold: 'bg-gold/10',
    white: 'bg-white/5',
    dark: 'bg-[#1a1a1a]',
  };

  const baseStyles: React.CSSProperties = {
    width: type === 'line' ? size * 2 : size,
    height: type === 'line' ? 2 : size,
    borderRadius: type === 'circle' ? '50%' : type === 'rectangle' ? '0' : '2px',
    ...position,
  };

  const MotionDiv = motion.div;

  return (
    <motion.div
      className={`absolute ${colorClasses[color]} ${className}`}
      style={baseStyles}
      {...(animate && {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 1, ease: 'easeOut' },
      })}
    />
  );
};

// Decorative line with gradient
export const DecorativeLine: React.FC<{ className?: string; width?: number }> = ({
  className = '',
  width = 300,
}) => (
  <motion.div
    initial={{ scaleX: 0 }}
    whileInView={{ scaleX: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1, ease: 'easeOut' }}
    className={`h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent ${className}`}
    style={{ width, transformOrigin: 'left' }}
  />
);

// Offset decorative element
export const OffsetDot: React.FC<{
  size?: number;
  offset?: { x: number; y: number };
}> = ({ size = 8, offset = { x: 0, y: 0 } }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: 0.5, duration: 0.5 }}
    className="absolute w-2 h-2 bg-gold rounded-full"
    style={{
      width: size,
      height: size,
      transform: `translate(${offset.x}px, ${offset.y}px)`,
    }}
  />
);

export default GeometricShape;
