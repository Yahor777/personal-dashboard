import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../ui/utils';

export interface BentoItemProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  href?: string;
}

export function BentoItem({ title, description, icon, className, href }: BentoItemProps) {
  const Element = href ? 'a' : 'div';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30%' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'group relative rounded-xl border border-white/10 bg-card/80 backdrop-blur-sm',
        'shadow-sm overflow-hidden',
        'hover:border-primary/30 hover:shadow-md',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ background: 'radial-gradient(600px circle at 25% 25%, rgba(56, 189, 248, 0.15), transparent 40%)' }} />
      <div className="p-5">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
}