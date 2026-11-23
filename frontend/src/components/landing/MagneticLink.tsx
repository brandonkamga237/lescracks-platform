import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

const SPRING = { stiffness: 260, damping: 18, mass: 0.6 };

interface MagneticLinkProps {
  children: ReactNode;
  className?: string;
  /** An in-app route; otherwise `href` is used as a plain link. */
  to?: string;
  href?: string;
  /** Opens in a new tab: an external site. */
  external?: boolean;
  ariaLabel?: string;
}

/** A call to action that leans toward a mouse pointer, a sign that it can be pressed. */
export default function MagneticLink({ children, className, to, href, external = false, ariaLabel }: MagneticLinkProps) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const x = useSpring(offsetX, SPRING);
  const y = useSpring(offsetY, SPRING);

  const follow = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    offsetX.set((event.clientX - box.left - box.width / 2) * 0.2);
    offsetY.set((event.clientY - box.top - box.height / 2) * 0.3);
  };
  const settle = () => { offsetX.set(0); offsetY.set(0); };
  const shared = { className, style: { x, y }, onPointerMove: follow, onPointerLeave: settle, 'aria-label': ariaLabel };

  // An app route stays a real link (new tab, copy link) but navigates without a page load.
  const goTo = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!to || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };

  if (to) return <motion.a href={to} onClick={goTo} {...shared}>{children}</motion.a>;
  return <motion.a href={href} {...shared} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</motion.a>;
}
