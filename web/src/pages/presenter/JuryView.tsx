import type { Team, EventSnapshot } from '@shared/types';
import { rankIndices } from '@shared/ranking';
import { BigScreen } from '@/components/frames/BigScreen';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

export function JuryView({
  snapshot,
  teams,
}: {
  snapshot: EventSnapshot;
  teams: Team[];
}) {
  const scoreOf = (teamId: string) =>
    snapshot.jury.find((j) => j.teamId === teamId)?.points ?? 0;
  const ranked = [...teams].sort((a, b) => scoreOf(b.id) - scoreOf(a.id));
  const scoreMap = Object.fromEntries(ranked.map((t) => [t.id, scoreOf(t.id)]));
  const ranks = rankIndices(
    ranked.map((t) => t.id),
    scoreMap,
  );
  const max = Math.max(1, ...teams.map((t) => scoreOf(t.id)));

  return (
    <BigScreen
      live="РЕЖИМ ЖУРІ"
      title="Рахунок наживо"
      subtitle="Журі називає бали — ведучий додає їх, і всі бачать зміну одразу"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-[0.35vw] overflow-hidden">
        {ranked.map((team, i) => (
          <JuryRow key={team.id} team={team} rank={ranks[i]} score={scoreOf(team.id)} max={max} />
        ))}
      </div>
      <p className="mt-[0.8vw] text-center tv-label text-[#9db3c8]">
        Керування балами — на панелі ведучого
      </p>
    </BigScreen>
  );
}

function JuryRow({
  team,
  rank,
  score,
  max,
}: {
  team: Team;
  rank: number;
  score: number;
  max: number;
}) {
  const shown = useCountUp(score);
  const top = rank === 0 && score > 0;

  return (
    <div
      className={cn(
        'grid grid-cols-[clamp(1.3rem,1.8vw,2rem)_clamp(1.7rem,2.4vw,2.8rem)_1fr_auto] items-center gap-[1vw] rounded-xl border px-[1.2vw] py-[0.4vw] transition-all duration-500',
        top ? 'border-[#ffcb3d]/35 bg-[#ffcb3d]/10' : 'border-white/[0.09] bg-white/[0.05]',
      )}
    >
      <div className={cn('font-display text-[clamp(1rem,1.4vw,1.6rem)]', top ? 'text-[#ffcb3d]' : 'text-[#8ea2b6]')}>
        {rank + 1}
      </div>
      <div
        className="flex h-[clamp(1.7rem,2.4vw,2.8rem)] w-[clamp(1.7rem,2.4vw,2.8rem)] items-center justify-center rounded-full text-[clamp(0.9rem,1.2vw,1.4rem)]"
        style={{ background: team.color }}
      >
        {team.icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[clamp(1.05rem,1.5vw,1.8rem)] font-extrabold">{team.name}</div>
        <div className="mt-[0.3vw] h-[clamp(4px,0.5vw,8px)] overflow-hidden rounded bg-white/[0.08]">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${(score / max) * 100}%`, background: team.color }}
          />
        </div>
      </div>
      <div className="min-w-[clamp(2.4rem,3.6vw,4.2rem)] text-right font-display text-[clamp(1.2rem,1.8vw,2.2rem)]">{shown}</div>
    </div>
  );
}
