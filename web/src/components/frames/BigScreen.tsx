import * as React from 'react';

interface BigScreenProps {
  brandIcon?: string;
  live?: React.ReactNode;
  liveTone?: 'red' | 'gold';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

/** Full-viewport dark "big screen" surface for presenter/display screens. */
export function BigScreen({
  brandIcon = '🤝',
  live,
  liveTone = 'red',
  title,
  subtitle,
  children,
  headerRight,
}: BigScreenProps) {
  return (
    <div className="ef-surface-dark flex h-[100dvh] flex-col overflow-hidden text-white">
      <header className="flex items-center justify-between px-[clamp(1.5rem,3vw,4rem)] pt-[clamp(1.2rem,2.4vw,3rem)]">
        <div className="flex items-center gap-[0.8vw] font-display tv-h2 font-bold">
          <span className="flex h-[clamp(2.2rem,3.2vw,4rem)] w-[clamp(2.2rem,3.2vw,4rem)] items-center justify-center rounded-lg bg-accent-blue text-[clamp(1.1rem,1.6vw,2rem)]">
            {brandIcon}
          </span>
          є<span className="text-glow">Френдшіп</span>
        </div>
        <div className="flex items-center gap-[1vw]">
          {live && (
            <div
              className="flex items-center gap-[0.6vw] rounded-full border px-[1.3vw] py-[0.65vw] tv-label font-bold"
              style={
                liveTone === 'gold'
                  ? {
                      background: 'rgba(255,203,61,0.14)',
                      borderColor: 'rgba(255,203,61,0.3)',
                      color: '#ffe6a3',
                    }
                  : {
                      background: 'rgba(255,255,255,0.08)',
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: '#cfe8ff',
                    }
              }
            >
              <span
                className="h-[clamp(8px,0.8vw,14px)] w-[clamp(8px,0.8vw,14px)] animate-pulse2 rounded-full"
                style={{ background: liveTone === 'gold' ? '#ffcb3d' : '#ff5b5b' }}
              />
              {live}
            </div>
          )}
          {headerRight}
        </div>
      </header>

      <main className="flex flex-1 flex-col px-[clamp(1.5rem,3vw,4rem)] pb-[clamp(1.5rem,3vw,4rem)] pt-[clamp(0.8rem,1.5vw,2rem)]">
        {(title || subtitle) && (
          <div className="mb-[clamp(1rem,2vw,2.5rem)] mt-[clamp(0.5rem,1vw,1.5rem)] text-center">
            {title && <h3 className="font-display tv-h1">{title}</h3>}
            {subtitle && (
              <p className="mt-[clamp(0.4rem,0.8vw,1rem)] tv-subtitle text-[#9db3c8]">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
