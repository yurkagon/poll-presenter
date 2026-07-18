import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="ef-surface-light flex min-h-[100dvh] flex-col items-center justify-center gap-8 p-6 text-center">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-soft">
          Молодіжний табір Френдшіп
        </div>
        <h1 className="font-display text-4xl text-ink">
          є<span className="text-accent-blue">Френдшіп</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Інтерактивна гра для табору</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/join"
          className="rounded-2xl bg-ink px-8 py-4 font-bold text-white shadow-glass"
        >
          Я учасник →
        </Link>
        <Link
          to="/present"
          className="rounded-2xl border border-white/80 bg-white/70 px-8 py-4 font-bold text-ink"
        >
          Спільний екран
        </Link>
        <Link
          to="/login"
          className="rounded-2xl border border-white/80 bg-white/70 px-8 py-4 font-bold text-ink"
        >
          Панель ведучого
        </Link>
      </div>
    </div>
  );
}
