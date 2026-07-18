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
    <div className="ef-surface-dark flex min-h-[100dvh] flex-col text-white">
      <header className="flex items-center justify-between px-8 pt-6">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue text-base">
            {brandIcon}
          </span>
          є<span className="text-glow">Френдшіп</span>
        </div>
        <div className="flex items-center gap-3">
          {live && (
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold"
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
                className="h-2 w-2 animate-pulse2 rounded-full"
                style={{ background: liveTone === 'gold' ? '#ffcb3d' : '#ff5b5b' }}
              />
              {live}
            </div>
          )}
          {headerRight}
        </div>
      </header>

      <main className="flex flex-1 flex-col px-8 pb-8 pt-4">
        {(title || subtitle) && (
          <div className="mb-6 mt-2 text-center">
            {title && <h3 className="font-display text-3xl">{title}</h3>}
            {subtitle && (
              <p className="mt-1.5 text-sm text-[#9db3c8]">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
