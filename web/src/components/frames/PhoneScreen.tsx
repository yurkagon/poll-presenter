import * as React from 'react';

interface PhoneScreenProps {
  tag?: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  cta?: React.ReactNode;
}

/** Full-viewport light "phone" surface for participant screens. */
export function PhoneScreen({ tag, title, children, cta }: PhoneScreenProps) {
  return (
    <div className="ef-surface-light flex min-h-[100dvh] flex-col">
      <header className="px-6 pb-2 pt-8">
        {tag && (
          <span className="ef-glass mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
            {tag}
          </span>
        )}
        <h1 className="font-display text-2xl leading-tight text-ink">{title}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-28 pt-2">{children}</main>

      {cta && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4">{cta}</div>
      )}
    </div>
  );
}
