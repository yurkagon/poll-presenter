import type { Team, EventSnapshot } from '@shared/types';
import { rankIndices } from '@shared/ranking';
import { BigScreen } from '@/components/frames/BigScreen';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];
const BAR_H = [
  'h-[clamp(120px,14vw,220px)]',
  'h-[clamp(85px,9.5vw,160px)]',
  'h-[clamp(65px,7vw,120px)]',
];
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
      <div className="flex flex-1 items-end justify-center gap-[1.6vw] pb-[0.4vw]">
        {visualOrder.map((rankIdx) => {
          const team = teamById(top3[rankIdx]);
          if (!team) return null;
          const shown = isRevealed(rankIdx);
          const rank = ranks[rankIdx];
          return (
            <div
              key={rankIdx}
              className={cn(
                'flex w-[clamp(200px,18vw,300px)] flex-col items-center gap-[0.5vw] transition-all duration-500',
                shown ? 'opacity-100 translate-y-0' : 'translate-y-8 opacity-0',
              )}
            >
              <div className="text-[clamp(1.6rem,2.8vw,3.4rem)]">{MEDALS[rank]}</div>
              <div
                className="flex h-[clamp(3.2rem,5.6vw,6rem)] w-[clamp(3.2rem,5.6vw,6rem)] items-center justify-center rounded-full border-[3px] border-white/25 text-[clamp(1.4rem,2.6vw,3rem)]"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="line-clamp-2 min-h-[2.4em] w-full text-center text-[clamp(1.1rem,1.6vw,1.7rem)] font-extrabold leading-[1.2]">
                {team.name}
              </div>
              <div className="tv-label font-bold text-[#9db3c8]">
                {countOf(team.id)} балів
              </div>
              <div
                className={cn(
                  'flex w-full items-start justify-center rounded-t-2xl pt-[1vw] font-display text-[clamp(1.6rem,2.8vw,3.4rem)] font-bold text-[#0a1424]',
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
        <div className="mx-auto mt-[0.5vw] grid w-full max-w-5xl grid-cols-2 gap-[0.35vw]">
          {rest.map((teamId, i) => {
            const team = teamById(teamId);
            const rankIdx = i + 3;
            if (!team) return null;
            return (
              <div
                key={teamId}
                className={cn(
                  'flex min-w-0 items-center gap-[0.8vw] rounded-lg border border-white/[0.08] bg-white/[0.045] px-[1vw] py-[0.4vw] text-[clamp(0.9rem,1.15vw,1.3rem)] transition-all duration-300',
                  isRevealed(rankIdx) ? 'opacity-100' : 'opacity-0',
                )}
              >
                <span className="w-[1.6vw] font-extrabold text-[#8ea2b6]">{ranks[rankIdx] + 1}</span>
                <span
                  className="flex h-[1.8vw] w-[1.8vw] shrink-0 items-center justify-center rounded-full text-[0.9vw]"
                  style={{ background: team.color }}
                >
                  {team.icon}
                </span>
                <span className="flex-1 truncate font-bold">{team.name}</span>
                <span className="shrink-0 font-bold text-[#9db3c8]">{countOf(team.id)} балів</span>
              </div>
            );
          })}
        </div>
      )}
    </BigScreen>
  );
}
