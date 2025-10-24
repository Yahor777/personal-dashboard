import React, { useRef, useState } from 'react';
import { cn } from '../ui/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glare?: boolean;
}

// CSS-based 3D tilt card with optional glare.
export default function TiltCard({ className, children, glare = true, ...props }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -12; // rotateX
    const ry = (px - 0.5) * 12;  // rotateY
    setTransform(`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`);
    setGlarePos({ x: px * 100, y: py * 100 });
  };

  const handleLeave = () => {
    setTransform('');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform: transform, transformStyle: 'preserve-3d', transition: 'transform 200ms ease-out' }}
      className={cn(
        'relative rounded-xl border border-white/10 bg-card text-card-foreground shadow-sm',
        'will-change-transform',
        'overflow-hidden',
        className,
      )}
      {...props}
    >
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0"
          style={{
            background: `radial-gradient(600px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.12), transparent 40%)`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
      <div className="relative z-10 p-5">
        {children}
      </div>
    </div>
  );
}