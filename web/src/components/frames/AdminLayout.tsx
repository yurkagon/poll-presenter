import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin', label: 'Розклад', end: true },
  { to: '/admin/events/new', label: '+ Нова подія' },
  { to: '/admin/results', label: 'Введення результату' },
  { to: '/admin/teams', label: 'Команди' },
  { to: '/admin/control', label: 'Керування' },
];

export function AdminLayout() {
  const navigate = useNavigate();

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    navigate('/login');
  };

  return (
    <div className="ef-surface-light min-h-[100dvh] p-4 md:p-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-black/5 bg-white shadow-glass">
        <div className="flex items-center justify-between bg-gradient-to-br from-[#bfe3ee] via-[#cfeadd] to-[#e2f0cf] px-6 py-4">
          <div className="font-display text-base font-bold text-ink">
            Панель ведучого · <span className="text-accent-blue">єФрендшіп</span>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11.5px] font-bold text-ink-soft hover:text-ink"
          >
            Вийти
          </button>
        </div>

        <nav className="flex flex-wrap gap-1.5 px-6 pt-4">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'rounded-t-xl px-4 py-2.5 font-sans text-[12.5px] font-bold transition-colors',
                  isActive ? 'bg-ink text-white' : 'bg-[#f1f3f5] text-ink-soft',
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="max-h-[calc(100dvh-180px)] overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
