import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../ui/utils';

interface ParallaxScrollProps {
  children?: React.ReactNode;
  className?: string;
}

// Simple layered parallax using scroll progress.
export default function ParallaxScroll({ children, className }: ParallaxScrollProps) {
  const { scrollYProgress } = useScroll();
  const layer1Y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], [0, -160]);

  return (
    <div className={cn('relative h-[420px] overflow-hidden rounded-2xl border border-white/10', className)}>
      <motion.div style={{ y: layer1Y }} className="absolute inset-x-0 top-0 h-[220px]">
        <div className="h-full bg-gradient-to-b from-primary/15 to-transparent" />
      </motion.div>
      <motion.div style={{ y: layer2Y }} className="absolute inset-x-0 top-10">
        <div className="mx-auto max-w-3xl rounded-xl p-6 bg-card/80 backdrop-blur-sm border border-white/10 shadow-sm">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold">Параллакс‑секция</h3>
            <p className="text-sm text-muted-foreground">
              Лёгкий параллакс создаёт глубину и фокус на ключевых блоках.
            </p>
          </div>
        </div>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-2xl p-4 text-center text-xs text-muted-foreground">
          Прокручивай страницу — заметишь смещение слоёв.
        </div>
      </div>
      {children}
    </div>
  );
}