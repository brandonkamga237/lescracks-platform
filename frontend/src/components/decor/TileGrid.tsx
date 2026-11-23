import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const CELL = 64;
const MAX_TILES = 12;

interface Tile {
  id: number;
  left: number;
  top: number;
}

interface TileGridProps {
  /** `hero` fades out around a centred ellipse, `bottom` fades out towards the top. */
  fade: 'hero' | 'bottom';
  /** Lights the lines in gold around the pointer. */
  spotlight?: boolean;
}

/**
 * The squared ground behind a section: a quiet grid where a few cells light up on their own.
 * It fills its nearest positioned parent, which must be `relative isolate`.
 */
export default function TileGrid({ fade, spotlight = false }: TileGridProps) {
  const root = useRef<HTMLDivElement>(null);
  const gold = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    const host = root.current?.parentElement;
    if (reduced || !host) return;

    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(host);

    let next = 0;
    const timer = window.setInterval(() => {
      if (!visible || document.hidden) return;
      const cols = Math.floor(host.clientWidth / CELL);
      const rows = Math.floor(host.clientHeight / CELL);
      const row = fade === 'bottom' ? rows - 1 - Math.floor(Math.random() * Math.ceil(rows / 2)) : Math.floor(Math.random() * rows);
      const tile = { id: next++, left: 1 + CELL * Math.floor(Math.random() * cols), top: 1 + CELL * row };
      setTiles((current) => [...current.slice(-MAX_TILES), tile]);
    }, 450);

    const move = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      gold.current?.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
      gold.current?.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
    };
    const leave = () => gold.current?.style.setProperty('--spot-y', '-30%');
    if (spotlight) {
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerleave', leave);
    }

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [reduced, spotlight, fade]);

  return (
    <div ref={root} aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 ${fade === 'hero' ? 'fade-hero' : 'fade-up'}`}>
      <div className="tile-grid absolute inset-0" />
      {tiles.map((tile) => (
        <motion.div
          key={tile.id}
          className="absolute h-[63px] w-[63px] bg-gold-400/[0.09]"
          style={{ left: tile.left, top: tile.top }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2.6, ease: 'easeInOut' }}
          onAnimationComplete={() => setTiles((current) => current.filter((item) => item.id !== tile.id))}
        />
      ))}
      {spotlight && !reduced && <div ref={gold} className="tile-grid-gold absolute inset-0" />}
    </div>
  );
}
