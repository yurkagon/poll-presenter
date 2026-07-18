import { useEffect, useState } from 'react';
import type { Team, EventDto } from '@shared/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamAvatar } from '@/components/team/TeamAvatar';
import { BASE_POINTS, typeOf, weightOf } from '@/lib/constants';

export function AdminResultsEntryPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sel, setSel] = useState<EventDto | null>(null);

  useEffect(() => {
    api.events.list().then(setEvents).catch(() => {});
    api.teams.list().then(setTeams).catch(() => {});
  }, []);

  if (!sel) {
    return (
      <div>
        <h2 className="mb-4 font-display text-lg text-ink">Введення результату</h2>
        <div className="flex flex-col gap-2">
          {events.map((e) => (
            <button
              key={e.id}
              onClick={() => setSel(e)}
              className="flex items-center gap-3 rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] px-4 py-3 text-left"
            >
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">{e.name}</div>
                <div className="text-[11px] font-semibold text-ink-soft">
                  {typeOf(e.type).title} · {e.status}
                </div>
              </div>
              <span className="text-ink-faint">→</span>
            </button>
          ))}
          {events.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-faint">Подій ще немає</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setSel(null)}
        className="mb-4 text-[13px] font-bold text-accent-blue"
      >
        ← Усі події
      </button>
      <div className="mb-4 font-display text-lg text-ink">{sel.name}</div>
      <ResultForm event={sel} teams={teams} onSaved={() => setSel(null)} />
    </div>
  );
}

function ResultForm({
  event,
  teams,
  onSaved,
}: {
  event: EventDto;
  teams: Team[];
  onSaved: () => void;
}) {
  if (event.type === 'PLACEMENT') return <PlacementForm event={event} teams={teams} onSaved={onSaved} />;
  if (event.type === 'HYBRID') return <HybridForm event={event} teams={teams} onSaved={onSaved} />;
  if (event.type === 'INDIVIDUAL') return <IndividualForm event={event} onSaved={onSaved} />;
  return (
    <p className="rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4 text-sm text-ink-soft">
      Результат для «{typeOf(event.type).title}» рахується автоматично з голосів — просто
      закрий голосування на вкладці «Керування».
    </p>
  );
}

function PlacementForm({ event, teams, onSaved }: { event: EventDto; teams: Team[]; onSaved: () => void }) {
  const [order, setOrder] = useState<string[]>(teams.map((t) => t.id));
  const mult = weightOf(event.weight).mult;
  const byId = (id: string) => teams.find((t) => t.id === id)!;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const save = async () => {
    await api.events.enterResult(event.id, { placement: order });
    onSaved();
  };

  return (
    <div>
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
        Розстав за місцями (1 — переможець)
      </div>
      {order.map((id, i) => {
        const t = byId(id);
        const pts = i < BASE_POINTS.length ? Math.round(BASE_POINTS[i] * mult) : 0;
        return (
          <div
            key={id}
            className="mb-2 grid grid-cols-[30px_36px_34px_1fr_auto] items-center gap-3 rounded-xl border border-[#eef0f2] bg-[#f8f9fb] px-3 py-2.5"
          >
            <div className="text-center font-display text-[15px] text-ink-soft">{i + 1}</div>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded bg-[#eef0f2] px-2 text-[10px] font-extrabold disabled:opacity-30">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="rounded bg-[#eef0f2] px-2 text-[10px] font-extrabold disabled:opacity-30">▼</button>
            </div>
            <TeamAvatar team={t} size={32} />
            <div className="text-[13px] font-bold text-ink">{t.name}</div>
            <div className="text-right font-display text-base text-ink">
              {event.affectsScore ? pts : '—'}
            </div>
          </div>
        );
      })}
      <Button onClick={save} className="mt-2 w-full bg-ink" size="lg">
        Зберегти результат
      </Button>
    </div>
  );
}

function HybridForm({ event, teams, onSaved }: { event: EventDto; teams: Team[]; onSaved: () => void }) {
  const [jury, setJury] = useState<Record<string, number>>({});

  const save = async () => {
    await api.events.enterResult(event.id, { juryRaw: jury });
    onSaved();
  };

  return (
    <div>
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
        ⚖️ Бали журі (голоси глядачів беруться з голосування)
      </div>
      {teams.map((t) => (
        <div key={t.id} className="mb-2 flex items-center gap-3 rounded-xl border border-[#eef0f2] bg-[#f8f9fb] px-3 py-2">
          <TeamAvatar team={t} size={25} />
          <span className="flex-1 text-[11.5px] font-bold text-ink">{t.name}</span>
          <Input
            type="number"
            className="w-20 text-center"
            value={jury[t.id] ?? 0}
            onChange={(e) => setJury((j) => ({ ...j, [t.id]: Number(e.target.value) || 0 }))}
          />
        </div>
      ))}
      <Button onClick={save} className="mt-2 w-full bg-ink" size="lg">
        Зберегти результат
      </Button>
    </div>
  );
}

function IndividualForm({ event, onSaved }: { event: EventDto; onSaved: () => void }) {
  const [winners, setWinners] = useState<{ award: string; name: string }[]>([
    { award: 'Відзнака', name: '' },
  ]);

  const save = async () => {
    await api.events.enterResult(event.id, {
      individualWinners: winners.filter((w) => w.name.trim()),
    });
    onSaved();
  };

  return (
    <div>
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
        Хто отримує відзнаку
      </div>
      {winners.map((w, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <Input
            placeholder="Відзнака"
            className="w-32"
            value={w.award}
            onChange={(e) =>
              setWinners((ws) => ws.map((x, j) => (j === i ? { ...x, award: e.target.value } : x)))
            }
          />
          <Input
            placeholder="Ім'я учасника"
            value={w.name}
            onChange={(e) =>
              setWinners((ws) => ws.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
            }
          />
          <button
            onClick={() => setWinners((ws) => ws.filter((_, j) => j !== i))}
            className="px-2 text-ink-faint"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => setWinners((ws) => [...ws, { award: 'Відзнака', name: '' }])}
        className="mb-2 w-full rounded-xl border-[1.5px] border-dashed border-[#c9d0d6] py-2.5 font-bold text-ink-soft"
      >
        + Додати людину
      </button>
      <Button onClick={save} className="w-full bg-ink" size="lg">
        Зберегти результат
      </Button>
    </div>
  );
}
