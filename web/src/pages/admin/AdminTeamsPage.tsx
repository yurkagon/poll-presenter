import { useEffect, useState } from 'react';
import type { Team } from '@shared/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/team/TeamAvatar';

const DEFAULT_COLORS = ['#ff6b6b', '#4d96ff', '#ffcb3d', '#6bcb77', '#b06bf0', '#00c2a8', '#ff9f45'];

export function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [busy, setBusy] = useState(false);

  const load = () => api.teams.list().then(setTeams).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.teams.create({ name: name.trim(), icon, color });
      setName('');
      setColor(DEFAULT_COLORS[teams.length % DEFAULT_COLORS.length]);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await api.teams.remove(id);
    await load();
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-lg text-ink">Команди зміни</h2>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
              Назва
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Маверік" />
          </div>
          <div className="w-20">
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
              Емодзі
            </label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="text-center" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full ring-offset-2 transition-all"
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
            />
          ))}
          <Button onClick={add} disabled={busy || !name.trim()} className="ml-auto">
            + Додати команду
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center gap-3 rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] px-4 py-3"
          >
            <TeamAvatar team={team} size={34} />
            <div className="flex-1 font-bold text-ink">{team.name}</div>
            <span className="text-xs font-semibold text-ink-faint">#{team.order}</span>
            <button
              onClick={() => remove(team.id)}
              className="rounded-lg px-2 py-1 text-ink-faint hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        {teams.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-faint">Команд ще немає</p>
        )}
      </div>
    </div>
  );
}
