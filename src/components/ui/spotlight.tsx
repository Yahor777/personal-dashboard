import * as React from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';

interface SpotlightProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Spotlight({ className, children }: SpotlightProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const background = useMotionTemplate`radial-gradient(420px circle at ${springX}px ${springY}px, rgba(99,102,241,0.28), transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-xl border bg-card text-card-foreground ${className ?? ''}`}
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}