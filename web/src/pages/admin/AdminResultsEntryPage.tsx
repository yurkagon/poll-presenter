import { useEffect, useState } from 'react';
import type { Team, EventDto } from '@shared/types';
import { rankIndices } from '@shared/ranking';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamAvatar } from '@/components/team/TeamAvatar';
import { AdhocTeamsManager } from '@/components/team/AdhocTeamsManager';
import { BASE_POINTS, typeOf, weightOf } from '@/lib/constants';

export function AdminResultsEntryPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [sel, setSel] = useState<EventDto | null>(null);

  useEffect(() => {
    api.events.list().then(setEvents).catch(() => {});
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
      <ResultForm event={sel} onSaved={() => setSel(null)} />
    </div>
  );
}

function ResultForm({ event, onSaved }: { event: EventDto; onSaved: () => void }) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    api.events.teams(event.id).then(setTeams).catch(() => {});
  }, [event.id]);

  return (
    <div>
      {event.participantMode === 'ADHOC' && (
        <AdhocTeamsManager eventId={event.id} onChange={setTeams} />
      )}

      {event.type === 'SCORE_ENTRY' ? (
        <ScoreEntryForm event={event} teams={teams} onSaved={onSaved} />
      ) : (
        <p className="rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4 text-sm text-ink-soft">
          Результат для «{typeOf(event.type).title}» рахується автоматично: таємні голоси
          глядачів — при закритті голосування, бали журі — наживо на вкладці «Керування».
        </p>
      )}
    </div>
  );
}

function ScoreEntryForm({ event, teams, onSaved }: { event: EventDto; teams: Team[]; onSaved: () => void }) {
  // Keep the raw text so the judge can type decimals (e.g. "11.5", "11,1")
  // without the trailing separator being swallowed by number parsing.
  const [raw, setRaw] = useState<Record<string, string>>({});
  const mult = weightOf(event.weight).mult;

  const numOf = (id: string) => parseFloat((raw[id] ?? '').replace(',', '.')) || 0;
  const scores: Record<string, number> = Object.fromEntries(
    teams.map((t) => [t.id, numOf(t.id)]),
  );

  const ranked = [...teams].sort((a, b) => scores[b.id] - scores[a.id]);
  const ranks = rankIndices(
    ranked.map((t) => t.id),
    scores,
  );

  const save = async () => {
    await api.events.enterResult(event.id, { scores });
    onSaved();
  };

  if (teams.length === 0) {
    return (
      <p className="rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4 text-sm text-ink-soft">
        Спочатку додай команди цієї події вище.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
        Внеси бал кожної команди — місця порахуються самі, однакові бали = одне місце
      </div>
      {ranked.map((t, i) => {
        const rank = ranks[i];
        const pts = rank < BASE_POINTS.length ? Math.round(BASE_POINTS[rank] * mult) : 0;
        return (
          <div
            key={t.id}
            className="mb-2 grid grid-cols-[30px_34px_1fr_auto_auto] items-center gap-3 rounded-xl border border-[#eef0f2] bg-[#f8f9fb] px-3 py-2.5"
          >
            <div className="text-center font-display text-[15px] text-ink-soft">{rank + 1}</div>
            <TeamAvatar team={t} size={32} />
            <div className="text-[13px] font-bold text-ink">{t.name}</div>
            <Input
              type="text"
              inputMode="decimal"
              className="w-20 text-center"
              placeholder="0"
              value={raw[t.id] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                // digits with an optional single decimal separator (dot or comma)
                if (/^[0-9]*[.,]?[0-9]*$/.test(v)) {
                  setRaw((s) => ({ ...s, [t.id]: v }));
                }
              }}
            />
            <div className="w-10 text-right font-display text-base text-ink">
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
