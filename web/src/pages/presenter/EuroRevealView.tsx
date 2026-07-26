import type { Team, EventSnapshot } from '@shared/types';
import { rankIndices } from '@shared/ranking';
import { BigScreen } from '@/components/frames/BigScreen';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

/**
 * Eurovision-style reveal: jury points are already known (shown live while
 * the event was CLOSED), so this reveals hidden audience points team-by-team
 * on top of them, then the final ranking. Driven by `step` (1..n) and `phase`
 * from the EURO_REVEAL broadcast.
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
  phase: 'audience' | 'done';
}) {
  const audienceRaw = (snapshot.result?.audienceRaw ?? {}) as Record<string, number>;
  const juryMap: Record<string, number> = {};
  for (const j of snapshot.jury) juryMap[j.teamId] = j.points;

  const ordered = [...teams].sort((a, b) => a.order - b.order);
  const audienceRevealed = Math.min(step, teams.length);

  const scoreFor = (idx: number, teamId: string) => {
    const jury = juryMap[teamId] ?? 0;
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
  // Tie-aware rank — equal totals share the same place.
  const finalTotals = Object.fromEntries(finalRanked.map((r) => [r.team.id, r.total]));
  const finalRanks = rankIndices(
    finalRanked.map((r) => r.team.id),
    finalTotals,
  );

  return (
    <BigScreen
      brandIcon="🎤"
      live="ТВОРЧИЙ ВЕЧІР · РЕВІЛ"
      liveTone="gold"
      title={phase === 'done' ? '🏆 Переможець ночі!' : 'Оголошуємо бали глядачів'}
      subtitle={
        phase === 'done'
          ? 'Підсумковий рейтинг цієї події'
          : 'Додаємо таємні голоси глядачів до балів журі'
      }
    >
      <div className="mb-[0.3vw] flex justify-center gap-[2vw] text-[clamp(0.8rem,0.95vw,1.1rem)] font-bold text-[#9db3c8]">
        <span className="flex items-center gap-[0.6vw]">
          <span className="h-[1vw] w-[1vw] rounded" style={{ background: '#3ad0ff' }} /> Бали журі
        </span>
        <span className="flex items-center gap-[0.6vw]">
          <span className="h-[1vw] w-[1vw] rounded" style={{ background: '#ffcb3d' }} /> Бали глядачів
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-[0.12vw] overflow-hidden">
        {ordered.map((team, idx) => {
          const { jury, aud, total } = scoreFor(idx, team.id);
          const isWinner = phase === 'done' && total === winnerTotal && total > 0;
          return (
            <EuroRow
              key={team.id}
              team={team}
              jury={jury}
              aud={aud}
              total={total}
              maxTotal={maxTotal}
              isWinner={isWinner}
            />
          );
        })}
      </div>

      {phase === 'done' && (
        <div className="mx-auto mt-[0.2vw] flex w-full max-w-5xl flex-1 flex-col justify-center gap-[0.12vw] overflow-hidden">
          {finalRanked.map((r, i) => (
            <div
              key={r.team.id}
              className={cn(
                'flex items-center gap-[0.8vw] rounded-lg border px-[1vw] py-[0.12vw] text-[clamp(0.85rem,1.1vw,1.3rem)]',
                finalRanks[i] === 0
                  ? 'border-[#ffcb3d]/35 bg-[#ffcb3d]/10'
                  : 'border-white/[0.08] bg-white/[0.04]',
              )}
            >
              <span className="w-[1.6vw] font-extrabold text-[#8ea2b6]">{finalRanks[i] + 1}</span>
              <span className="flex-1 truncate font-bold">
                {r.team.icon} {r.team.name}
              </span>
              <span className="shrink-0 font-bold text-[#9db3c8]">{r.total} балів</span>
            </div>
          ))}
        </div>
      )}
    </BigScreen>
  );
}

function EuroRow({
  team,
  jury,
  aud,
  total,
  maxTotal,
  isWinner,
}: {
  team: Team;
  jury: number;
  aud: number;
  total: number;
  maxTotal: number;
  isWinner: boolean;
}) {
  const shownTotal = useCountUp(total);

  return (
    <div className="grid grid-cols-[clamp(1.4rem,2vw,2.3rem)_clamp(9rem,15vw,17rem)_1fr_clamp(2.4rem,3.6vw,4.2rem)] items-center gap-[0.9vw]">
      <div
        className={cn(
          'flex h-[clamp(1.4rem,2vw,2.3rem)] w-[clamp(1.4rem,2vw,2.3rem)] items-center justify-center rounded-full text-[clamp(0.8rem,1vw,1.2rem)] transition-shadow',
          isWinner && 'shadow-[0_0_0_3px_#ffcb3d,0_0_18px_rgba(255,203,61,0.6)]',
        )}
        style={{ background: team.color }}
      >
        {team.icon}
      </div>
      <div className="truncate text-[clamp(0.95rem,1.3vw,1.6rem)] font-extrabold">{team.name}</div>
      <div className="flex h-[clamp(0.7rem,1vw,1.2rem)] overflow-hidden rounded-lg bg-white/[0.06]">
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
      <div className="text-right font-display text-[clamp(1.1rem,1.6vw,1.9rem)]">{shownTotal}</div>
    </div>
  );
}
