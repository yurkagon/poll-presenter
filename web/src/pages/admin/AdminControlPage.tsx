import { useEffect, useState, useCallback } from 'react';
import type { Team, EventDto, EventSnapshot } from '@shared/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/team/TeamAvatar';
import { typeOf } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function AdminControlPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null);

  const loadEvents = useCallback(() => api.events.list().then(setEvents).catch(() => {}), []);

  useEffect(() => {
    loadEvents();
    api.teams.list().then(setTeams).catch(() => {});
  }, [loadEvents]);

  const refreshSnapshot = useCallback(
    (id: string) => api.events.snapshot(id).then(setSnapshot).catch(() => {}),
    [],
  );

  const select = (id: string) => {
    setSelectedId(id);
    refreshSnapshot(id);
  };

  const after = async (id: string) => {
    await loadEvents();
    await refreshSnapshot(id);
  };

  const selected = events.find((e) => e.id === selectedId);
  const status = snapshot?.event.status ?? selected?.status;

  const showOnScreen = async () => {
    if (!selectedId) return;
    await api.game.setDisplay({ displayMode: 'EVENT', activeEventId: selectedId });
  };

  const act = async (fn: () => Promise<unknown>) => {
    if (!selectedId) return;
    await fn();
    await after(selectedId);
  };

  const addJury = async (teamId: string, points: number) => {
    if (!selectedId) return;
    await api.events.addJury(selectedId, teamId, points);
    await refreshSnapshot(selectedId);
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-lg text-ink">Керування показом</h2>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => api.game.setDisplay({ displayMode: 'LOBBY' })}>
          🖥 Лобі / QR
        </Button>
        <Button variant="secondary" onClick={() => api.game.setDisplay({ displayMode: 'LEADERBOARD' })}>
          📊 Турнірна таблиця
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            Події
          </div>
          <div className="flex flex-col gap-2">
            {events.map((e) => (
              <button
                key={e.id}
                onClick={() => select(e.id)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-all',
                  selectedId === e.id
                    ? 'border-ink bg-white shadow-glass'
                    : 'border-[#eef0f2] bg-[#f8f9fb]',
                )}
              >
                <div className="text-[13px] font-bold text-ink">
                  {typeOf(e.type).icon} {e.name}
                </div>
                <div className="text-[11px] font-semibold text-ink-soft">{e.status}</div>
              </button>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-ink-faint">Спочатку створи подію</p>
            )}
          </div>
        </div>

        {selected && (
          <div className="rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4">
            <div className="mb-1 font-display text-base text-ink">{selected.name}</div>
            <div className="mb-3 text-[11px] font-semibold text-ink-soft">
              {typeOf(selected.type).title} · статус {status}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={showOnScreen}>
                📺 Показати на екрані
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(() => api.events.lobby(selected.id))}>
                Лобі
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(() => api.events.open(selected.id))}>
                Відкрити голосування
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(() => api.events.close(selected.id))}>
                Закрити
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(() => api.events.reveal(selected.id))}>
                Розкрити
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act(() => api.events.euroNext(selected.id))}>
                ▶ Наступний крок
              </Button>
              <Button size="sm" onClick={() => act(() => api.events.complete(selected.id))}>
                ✓ Завершити
              </Button>
            </div>

            {(selected.type === 'JURY' || selected.type === 'HYBRID') && (
              <div className="mt-5">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                  Бали журі
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {teams.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-xl border border-[#eef0f2] bg-white px-3 py-2"
                    >
                      <TeamAvatar team={t} size={24} />
                      <span className="flex-1 text-[11.5px] font-bold text-ink">{t.name}</span>
                      <span className="mr-1 text-xs font-bold text-ink-soft">
                        {snapshot?.jury.find((j) => j.teamId === t.id)?.points ?? 0}
                      </span>
                      {[1, 3, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => addJury(t.id, n)}
                          className="rounded-md bg-ink px-2 py-1 text-[10px] font-extrabold text-white hover:bg-accent-blue"
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
