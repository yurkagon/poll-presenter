import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
  active?: boolean;
  tone?: 'dark' | 'light';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Pill selector. `dark` variant = big-screen (.chip2), `light` = admin (.chipL). */
export function Chip({ active, tone = 'light', onClick, children, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-sans font-bold transition-all',
        tone === 'dark'
          ? 'border px-3.5 py-1.5 text-xs'
          : 'rounded-xl border-[1.5px] px-4 py-2.5 text-[12.5px]',
        tone === 'dark' &&
          (active
            ? 'border-glow bg-glow text-[#04141f]'
            : 'border-white/15 bg-white/[0.06] text-[#cfe8ff]'),
        tone === 'light' &&
          (active
            ? 'border-transparent bg-ink text-white'
            : 'border-transparent bg-[#f1f3f5] text-ink-soft'),
        className,
      )}
    >
      {children}
    </button>
  );
}
