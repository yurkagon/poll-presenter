import { useEffect, useState, useCallback } from 'react';
import type { Team, EventDto, EventSnapshot, GameState, LobbySnapshot } from '@shared/types';
import { api } from '@/lib/api';
import { joinLive, useSocketEvent, EV } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/team/TeamAvatar';
import { AdhocTeamsManager } from '@/components/team/AdhocTeamsManager';
import { typeOf, STATUS_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function AdminControlPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    displayMode: 'LOBBY',
    activeEventId: null,
  });
  const [lobby, setLobby] = useState<LobbySnapshot>({ teams: [], totalParticipants: 0 });

  const loadEvents = useCallback(() => api.events.list().then(setEvents).catch(() => {}), []);

  useEffect(() => {
    loadEvents();
    api.game.state().then(setGameState).catch(() => {});
    api.participants.lobby().then(setLobby).catch(() => {});
    joinLive('presenter');
  }, [loadEvents]);

  // Keep the joined-participant count live as people join/reset, without a reload.
  useSocketEvent<LobbySnapshot>(EV.LOBBY_UPDATED, useCallback((l) => setLobby(l), []));

  const resetParticipants = async () => {
    if (
      !window.confirm(
        `Скинути прив'язку до команд для ${lobby.totalParticipants} учасників? Голоси й історія збережуться — просто всім треба буде наново обрати команду.`,
      )
    ) {
      return;
    }
    setLobby(await api.participants.resetTeams());
  };

  const refreshSnapshot = useCallback(
    (id: string) => api.events.snapshot(id).then(setSnapshot).catch(() => {}),
    [],
  );

  const select = (id: string) => {
    setSelectedId(id);
    setError(null);
    refreshSnapshot(id);
    api.events.teams(id).then(setTeams).catch(() => {});
  };

  const after = async (id: string) => {
    await loadEvents();
    await refreshSnapshot(id);
  };

  const selected = events.find((e) => e.id === selectedId);
  const status = snapshot?.event.status ?? selected?.status;
  const revealStep = snapshot?.event.revealStep ?? 0;
  const revealTotal = teams.length;
  const revealDone = revealStep >= revealTotal;

  const showOnScreen = async () => {
    if (!selectedId) return;
    setGameState(await api.game.setDisplay({ displayMode: 'EVENT', activeEventId: selectedId }));
  };

  const friendlyError = (e: unknown): string => {
    const raw = e instanceof Error ? e.message : String(e);
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart));
        if (typeof parsed.message === 'string') return parsed.message;
      } catch {
        // fall through to raw message
      }
    }
    return raw;
  };

  /** Every guided step both puts this event on the shared screen and advances it. */
  const runStep = (fn: () => Promise<unknown>) => async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await showOnScreen();
      await fn();
      await after(selectedId);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  // Raw text per team so decimals (11.5) can be typed; committed on blur.
  const [juryInput, setJuryInput] = useState<Record<string, string>>({});

  const juryValue = (teamId: string) =>
    juryInput[teamId] ??
    String(snapshot?.jury.find((j) => j.teamId === teamId)?.points ?? '');

  const commitJury = async (teamId: string) => {
    if (!selectedId) return;
    const rawText = juryInput[teamId];
    if (rawText === undefined) return; // nothing typed
    const score = Math.min(12, Math.max(0, parseFloat(rawText.replace(',', '.')) || 0));
    setError(null);
    try {
      await api.events.setJury(selectedId, teamId, score);
      await refreshSnapshot(selectedId);
      setJuryInput((s) => {
        const next = { ...s };
        delete next[teamId];
        return next;
      });
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  type Step = { label: string; help: string; run: () => Promise<void> };

  const nextStep = (event: EventDto): Step | null => {
    if (status === 'COMPLETED') return null;

    if (event.type === 'SCORE_ENTRY') {
      if (status !== 'REVEALED') {
        return {
          label: '📺 Показати подіум і почати розкриття',
          help: 'Перемкне спільний екран на цю подію — місця поки приховані.',
          run: runStep(() => api.events.reveal(event.id)),
        };
      }
      if (!revealDone) {
        return {
          label: `▶ Показати наступне місце (${revealStep}/${revealTotal})`,
          help: 'Відкриває місця від останнього до першого — натискай, коли готовий(-а) показати наступне.',
          run: runStep(() => api.events.euroNext(event.id)),
        };
      }
      return {
        label: '✓ Завершити подію',
        help: 'Зафіксує бали цієї події в турнірній таблиці.',
        run: runStep(() => api.events.complete(event.id)),
      };
    }

    // EURO
    if (status === 'DRAFT' || status === 'LOBBY') {
      return {
        label: '📺 Відкрити голосування глядачів',
        help: 'Учасники зможуть проголосувати за 3 команди (не свою). Голоси нікому не показуються.',
        run: runStep(() => api.events.open(event.id)),
      };
    }
    if (status === 'OPEN') {
      const p = snapshot?.progress;
      return {
        label: '🔒 Закрити голосування',
        help: p?.expected
          ? `Проголосувало ${p.totalVotes} з ${p.expected}. Натисни, коли всі готові — далі почне виступати журі.`
          : 'Натисни, коли всі проголосували — далі почне виступати журі.',
        run: runStep(() => api.events.close(event.id)),
      };
    }
    if (status === 'CLOSED') {
      return {
        label: '🎬 Почати розкриття голосів глядачів',
        help: 'Спершу онови бали журі нижче — вони одразу з’являються на екрані. Тисни цю кнопку, коли журі закінчило.',
        run: runStep(() => api.events.reveal(event.id)),
      };
    }
    if (status === 'REVEALED' && !revealDone) {
      return {
        label: `▶ Додати голоси глядачів (${revealStep}/${revealTotal})`,
        help: 'Кожне натискання додає до балів журі приховані голоси ще однієї команди.',
        run: runStep(() => api.events.euroNext(event.id)),
      };
    }
    return {
      label: '✓ Завершити подію',
      help: 'Зафіксує підсумковий бал (журі + глядачі) у турнірній таблиці.',
      run: runStep(() => api.events.complete(event.id)),
    };
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-lg text-ink">Керування показом</h2>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className={cn(gameState.displayMode === 'LOBBY' && 'bg-ink text-white hover:bg-ink/90')}
          onClick={() => api.game.setDisplay({ displayMode: 'LOBBY' }).then(setGameState)}
        >
          🖥 Лобі / QR{gameState.displayMode === 'LOBBY' && ' · на екрані'}
        </Button>
        <Button
          variant="secondary"
          className={cn(gameState.displayMode === 'LEADERBOARD' && 'bg-ink text-white hover:bg-ink/90')}
          onClick={() => api.game.setDisplay({ displayMode: 'LEADERBOARD' }).then(setGameState)}
        >
          📊 Турнірна таблиця{gameState.displayMode === 'LEADERBOARD' && ' · на екрані'}
        </Button>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#eef0f2] bg-[#f8f9fb] px-4 py-3">
        <div className="flex-1 text-[12.5px] font-semibold text-ink-soft">
          👥 Приєднано учасників: <span className="font-extrabold text-ink">{lobby.totalParticipants}</span>
        </div>
        <button
          onClick={resetParticipants}
          className="text-[11.5px] font-bold text-red-500 underline decoration-dotted underline-offset-2 hover:text-red-600"
        >
          🔄 Скинути перед новим днем
        </button>
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
                <div className="text-[11px] font-semibold text-ink-soft">{STATUS_LABEL[e.status]}</div>
              </button>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-ink-faint">Спочатку створи подію</p>
            )}
          </div>
        </div>

        {selected && status && (
          <div className="rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4">
            <div className="mb-1 font-display text-base text-ink">{selected.name}</div>
            <div className="mb-4 text-[11px] font-semibold text-ink-soft">
              {typeOf(selected.type).title} · статус {STATUS_LABEL[status]}
            </div>

            {selected.participantMode === 'ADHOC' && (
              <AdhocTeamsManager eventId={selected.id} onChange={setTeams} />
            )}

            {(() => {
              const step = nextStep(selected);
              if (!step) {
                return (
                  <div className="rounded-xl border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-[12.5px] font-bold text-accent-green">
                    ✓ Подію завершено — бали вже в турнірній таблиці.
                  </div>
                );
              }
              return (
                <div>
                  <Button
                    onClick={step.run}
                    size="lg"
                    className="h-auto w-full whitespace-normal bg-ink py-4 text-center leading-snug"
                  >
                    {step.label}
                  </Button>
                  <p className="mt-2 text-[11.5px] font-semibold leading-snug text-ink-soft">
                    {step.help}
                  </p>
                </div>
              );
            })()}

            {error && (
              <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-[11.5px] font-bold text-red-600">
                ⚠️ {error}
              </div>
            )}

            {selected.type === 'EURO' && status === 'CLOSED' && (
              <div className="mt-5">
                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                  Бали журі (0–12) — з'являються на екрані одразу
                </div>
                <div className="mb-2 text-[11px] font-semibold leading-snug text-ink-faint">
                  Постав кожній команді оцінку від 0 до 12 (можна з десятковими, напр. 11.5).
                  Це половина фінального балу — друга половина в глядачів.
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {teams.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-xl border border-[#eef0f2] bg-white px-3 py-2"
                    >
                      <TeamAvatar team={t} size={24} />
                      <span className="flex-1 text-[11.5px] font-bold text-ink">{t.name}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        className="w-16 rounded-lg border-[1.5px] border-[#e4e8eb] bg-[#fafbfc] px-2 py-1.5 text-center font-sans text-sm text-ink outline-none focus:border-accent-blue focus:bg-white"
                        value={juryValue(t.id)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^[0-9]*[.,]?[0-9]*$/.test(v)) {
                            setJuryInput((s) => ({ ...s, [t.id]: v }));
                          }
                        }}
                        onBlur={() => commitJury(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                      />
                      <span className="text-[11px] font-bold text-ink-faint">/ 12</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={showOnScreen}
              className="mt-5 text-[11.5px] font-bold text-ink-faint underline decoration-dotted underline-offset-2 hover:text-ink-soft"
            >
              📺 Ще раз показати цю подію на екрані
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
