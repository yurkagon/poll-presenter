import type { Team, EventSnapshot } from '@shared/types';
import { BigScreen } from '@/components/frames/BigScreen';
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
  const max = Math.max(1, ...teams.map((t) => scoreOf(t.id)));

  return (
    <BigScreen
      live="РЕЖИМ ЖУРІ"
      title="Рахунок наживо"
      subtitle="Журі називає бали — ведучий додає їх, і всі бачать зміну одразу"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-2.5">
        {ranked.map((team, i) => {
          const score = scoreOf(team.id);
          const top = i === 0 && score > 0;
          return (
            <div
              key={team.id}
              className={cn(
                'grid grid-cols-[30px_34px_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500',
                top
                  ? 'border-[#ffcb3d]/35 bg-[#ffcb3d]/10'
                  : 'border-white/[0.09] bg-white/[0.05]',
              )}
            >
              <div className={cn('font-display text-[15px]', top ? 'text-[#ffcb3d]' : 'text-[#8ea2b6]')}>
                {i + 1}
              </div>
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[15px]"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div>
                <div className="text-sm font-extrabold">{team.name}</div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded bg-white/[0.08]">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${(score / max) * 100}%`, background: team.color }}
                  />
                </div>
              </div>
              <div className="min-w-[52px] text-right font-display text-xl">{score}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-[#9db3c8]">
        Керування балами — на панелі ведучого
      </p>
    </BigScreen>
  );
}
