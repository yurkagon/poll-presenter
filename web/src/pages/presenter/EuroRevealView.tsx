import type { Team, EventSnapshot } from '@shared/types';
import { BigScreen } from '@/components/frames/BigScreen';
import { cn } from '@/lib/utils';

/**
 * Eurovision-style reveal: jury points revealed team-by-team, then audience
 * points added on top, then the final ranking. Driven by `step` (1..2n) and
 * `phase` from the EURO_REVEAL broadcast.
 */
export function EuroRevealView({
  snapshot,
  teams,
  step,
  phase,
}: {
  snapshot: EventSnapshot;
  teams: Team[];
  step: number;
  phase: 'jury' | 'audience' | 'done';
}) {
  const n = teams.length;
  const audienceRaw = (snapshot.result?.audienceRaw ?? {}) as Record<string, number>;
  const juryMap: Record<string, number> = {};
  for (const j of snapshot.jury) juryMap[j.teamId] = j.points;

  const ordered = [...teams].sort((a, b) => a.order - b.order);
  const juryRevealed = Math.min(step, n);
  const audienceRevealed = Math.max(0, step - n);

  const scoreFor = (idx: number, teamId: string) => {
    const jury = idx < juryRevealed ? juryMap[teamId] ?? 0 : 0;
    const aud = idx < audienceRevealed ? audienceRaw[teamId] ?? 0 : 0;
    return { jury, aud, total: jury + aud };
  };

  const maxTotal = Math.max(
    1,
    ...teams.map((t) => (juryMap[t.id] ?? 0) + (audienceRaw[t.id] ?? 0)),
  );

  const finalRanked = [...teams]
    .map((t) => ({ team: t, total: (juryMap[t.id] ?? 0) + (audienceRaw[t.id] ?? 0) }))
    .sort((a, b) => b.total - a.total);
  const winnerTotal = finalRanked[0]?.total ?? 0;

  return (
    <BigScreen
      brandIcon="🎤"
      live="ТВОРЧИЙ ВЕЧІР · РЕВІЛ"
      liveTone="gold"
      title={phase === 'done' ? '🏆 Переможець ночі!' : 'Оголошуємо бали'}
      subtitle={
        phase === 'jury'
          ? 'Спершу бали журі'
          : phase === 'audience'
            ? 'Тепер додаємо бали глядачів'
            : 'Підсумковий рейтинг цієї події'
      }
    >
      <div className="mb-3 flex justify-center gap-5 text-xs font-bold text-[#9db3c8]">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: '#3ad0ff' }} /> Бали журі
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: '#ffcb3d' }} /> Бали глядачів
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3">
        {ordered.map((team, idx) => {
          const { jury, aud, total } = scoreFor(idx, team.id);
          const isWinner = phase === 'done' && total === winnerTotal && total > 0;
          return (
            <div key={team.id} className="grid grid-cols-[34px_140px_1fr_60px] items-center gap-3">
              <div
                className={cn(
                  'flex h-[34px] w-[34px] items-center justify-center rounded-full text-[15px] transition-shadow',
                  isWinner && 'shadow-[0_0_0_3px_#ffcb3d,0_0_18px_rgba(255,203,61,0.6)]',
                )}
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="truncate text-[12.5px] font-extrabold">{team.name}</div>
              <div className="flex h-[22px] overflow-hidden rounded-lg bg-white/[0.06]">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${(jury / maxTotal) * 100}%`,
                    background: 'linear-gradient(90deg,#3d7fe0,#3ad0ff)',
                  }}
                />
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${(aud / maxTotal) * 100}%`,
                    background: 'linear-gradient(90deg,#ffcb3d,#ff9f45)',
                  }}
                />
              </div>
              <div className="text-right font-display text-base">{total}</div>
            </div>
          );
        })}
      </div>

      {phase === 'done' && (
        <div className="mx-auto mt-4 flex w-full max-w-2xl flex-col gap-1.5">
          {finalRanked.map((r, i) => (
            <div
              key={r.team.id}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs',
                i === 0
                  ? 'border-[#ffcb3d]/35 bg-[#ffcb3d]/10'
                  : 'border-white/[0.08] bg-white/[0.04]',
              )}
            >
              <span className="w-4 font-extrabold text-[#8ea2b6]">{i + 1}</span>
              <span className="flex-1 font-bold">
                {r.team.icon} {r.team.name}
              </span>
              <span className="font-bold text-[#9db3c8]">{r.total} балів</span>
            </div>
          ))}
        </div>
      )}
    </BigScreen>
  );
}
