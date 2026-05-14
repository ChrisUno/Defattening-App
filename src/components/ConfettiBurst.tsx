import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Piece {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  shape: 'square' | 'circle' | 'rect';
  duration: number;
}

const COLORS = ['#2563EB', '#4338CA', '#0EA5E9', '#38BDF8', '#A5B4FC', '#FFFFFF'];

interface ConfettiBurstProps {
  trigger: number;
  count?: number;
  origin?: 'top' | 'center';
}

export const ConfettiBurst = ({ trigger, count = 60, origin = 'top' }: ConfettiBurstProps) => {
  const [active, setActive] = useState(false);

  const pieces = useMemo<Piece[]>(() => {
    if (!trigger) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i + trigger * 1000,
      x: Math.random() * 100,
      y: origin === 'top' ? -10 : 40 + Math.random() * 20,
      rotate: Math.random() * 720 - 360,
      color: COLORS[i % COLORS.length],
      shape: (['square', 'circle', 'rect'] as const)[i % 3],
      duration: 1.6 + Math.random() * 1.6,
    }));
  }, [trigger, count, origin]);

  useEffect(() => {
    if (!trigger) return;
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 3200);
    return () => window.clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <AnimatePresence>
        {active &&
          pieces.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 1 }}
              animate={{
                x: `${p.x + (Math.random() * 30 - 15)}vw`,
                y: '110vh',
                rotate: p.rotate,
                opacity: 0,
              }}
              transition={{ duration: p.duration, ease: 'easeIn' }}
              className="absolute top-0 left-0"
              style={{
                width: p.shape === 'rect' ? 12 : 10,
                height: p.shape === 'rect' ? 6 : 10,
                background: p.color,
                borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'rect' ? '2px' : '3px',
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
};
