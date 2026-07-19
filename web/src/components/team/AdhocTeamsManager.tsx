import { useEffect, useState } from 'react';
import type { Team } from '@shared/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/team/TeamAvatar';

const DEFAULT_COLORS = ['#ff6b6b', '#4d96ff', '#ffcb3d', '#6bcb77', '#b06bf0', '#00c2a8', '#ff9f45'];

/** Create/list/delete the ad-hoc team roster scoped to a single event. */
export function AdhocTeamsManager({
  eventId,
  onChange,
}: {
  eventId: string;
  onChange?: (teams: Team[]) => void;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.events.teams(eventId).then((t) => {
      setTeams(t);
      onChange?.(t);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.teams.create({ name: name.trim(), icon, color, eventId });
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
    <div className="mb-5">
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
        Команди цієї події ({teams.length})
      </div>

      <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[#eef0f2] bg-white p-3.5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
              Назва
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Група 1" />
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
              className="h-7 w-7 rounded-full transition-all"
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
            />
          ))}
          <Button size="sm" onClick={add} disabled={busy || !name.trim()} className="ml-auto">
            + Додати команду
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center gap-3 rounded-xl border border-[#eef0f2] bg-white px-3 py-2"
          >
            <TeamAvatar team={team} size={28} />
            <div className="flex-1 text-[12.5px] font-bold text-ink">{team.name}</div>
            <button
              onClick={() => remove(team.id)}
              className="rounded-lg px-2 py-1 text-ink-faint hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        {teams.length === 0 && (
          <p className="py-3 text-center text-[12.5px] text-ink-faint">
            Команд ще немає — додай хоча б дві вище
          </p>
        )}
      </div>
    </div>
  );
}
