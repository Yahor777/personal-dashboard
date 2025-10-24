import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../ui/utils';

interface AnimatedGradientProps {
  className?: string;
  opacity?: number;
}

// Soft animated radial gradient backdrop.
// Designed to be placed inside a relatively positioned container.
export default function AnimatedGradient({ className, opacity = 0.6 }: AnimatedGradientProps) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity, scale: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className={cn(
        'pointer-events-none absolute inset-0 -z-10',
        'blur-3xl',
        className,
      )}
      style={{
        background:
          'radial-gradient(1200px circle at 50% 30%, rgba(56, 189, 248, 0.35), transparent 40%), ' +
          'radial-gradient(900px circle at 20% 70%, rgba(99, 102, 241, 0.35), transparent 35%), ' +
          'radial-gradient(800px circle at 80% 60%, rgba(34, 197, 94, 0.25), transparent 45%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}