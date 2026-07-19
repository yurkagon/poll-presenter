import type { Team, EventSnapshot } from '@shared/types';
import { rankIndices } from '@shared/ranking';
import { BigScreen } from '@/components/frames/BigScreen';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];
const BAR_H = ['h-[150px]', 'h-[110px]', 'h-[82px]'];
const BAR_BG = [
  'linear-gradient(180deg,#ffe98a,#ffcb3d)',
  'linear-gradient(180deg,#d9e4ee,#b9c6d4)',
  'linear-gradient(180deg,#f0c398,#e0a874)',
];

/**
 * Staged reveal: `revealStep` counts how many places are shown, revealed from
 * last place upward, then the podium 3 → 2 → 1.
 */
export function PodiumView({
  snapshot,
  teamById,
  revealStep,
}: {
  snapshot: EventSnapshot;
  teamById: (id: string) => Team | undefined;
  revealStep: number;
}) {
  const placement = snapshot.result?.placement ?? [];
  const scores = (snapshot.result?.scores ?? {}) as Record<string, number>;
  const countOf = (teamId: string) => scores[teamId] ?? 0;
  // Tie-aware rank per position — equal scores share the same place.
  const ranks = rankIndices(placement, scores);

  const total = placement.length;
  // reveal order: last..4th (bottom-up), then 3rd, 2nd, 1st
  const shownFromBottom = revealStep; // how many of the "rest+podium" are shown
  const isRevealed = (rankIdx: number) => {
    // rankIdx 0-based. Reveal sequence index for a rank:
    // ranks total-1 .. 3 first (rest), then 2,1,0.
    const seq = [
      ...Array.from({ length: Math.max(0, total - 3) }, (_, i) => total - 1 - i),
      2,
      1,
      0,
    ].filter((r) => r < total);
    const pos = seq.indexOf(rankIdx);
    return pos !== -1 && pos < shownFromBottom;
  };

  const top3 = placement.slice(0, 3);
  const rest = placement.slice(3);
  const visualOrder = [2, 0, 1].filter((i) => i < top3.length); // 3rd, 1st, 2nd

  return (
    <BigScreen
      live="РЕЗУЛЬТАТИ"
      liveTone="gold"
      title="Хто переміг у цьому раунді?"
      subtitle="Ведучий розкриває місця одне за одним"
    >
      <div className="flex flex-1 items-end justify-center gap-4 pb-1.5">
        {visualOrder.map((rankIdx) => {
          const team = teamById(top3[rankIdx]);
          if (!team) return null;
          const shown = isRevealed(rankIdx);
          const rank = ranks[rankIdx];
          return (
            <div
              key={rankIdx}
              className={cn(
                'flex w-[150px] flex-col items-center gap-2.5 transition-all duration-500',
                shown ? 'opacity-100 translate-y-0' : 'translate-y-8 opacity-0',
              )}
            >
              <div className="text-[26px]">{MEDALS[rank]}</div>
              <div
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-white/25 text-[22px]"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="min-h-[34px] text-center text-[13px] font-extrabold leading-tight">
                {team.name}
              </div>
              <div className="text-[11px] font-bold text-[#9db3c8]">
                {countOf(team.id)} балів
              </div>
              <div
                className={cn(
                  'flex w-full items-start justify-center rounded-t-2xl pt-2.5 font-display font-bold text-[#0a1424]',
                  BAR_H[rank],
                )}
                style={{ background: BAR_BG[rank] }}
              >
                {rank + 1}
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mx-auto mt-4 flex w-full max-w-xl flex-col gap-1.5">
          {rest.map((teamId, i) => {
            const team = teamById(teamId);
            const rankIdx = i + 3;
            if (!team) return null;
            return (
              <div
                key={teamId}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-[12.5px] transition-all duration-300',
                  isRevealed(rankIdx) ? 'opacity-100' : 'opacity-0',
                )}
              >
                <span className="w-4 font-extrabold text-[#8ea2b6]">{ranks[rankIdx] + 1}</span>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                  style={{ background: team.color }}
                >
                  {team.icon}
                </span>
                <span className="flex-1 font-bold">{team.name}</span>
                <span className="font-bold text-[#9db3c8]">{countOf(team.id)} балів</span>
              </div>
            );
          })}
        </div>
      )}
    </BigScreen>
  );
}
