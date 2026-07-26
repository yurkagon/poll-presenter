import type { Team, LobbySnapshot } from '@shared/types';
import { cn } from '@/lib/utils';

export function LobbyGrid({
  teams,
  lobby,
  myTeamId,
}: {
  teams: Team[];
  lobby: LobbySnapshot;
  myTeamId?: string | null;
}) {
  const countOf = (teamId: string) =>
    lobby.teams.find((t) => t.teamId === teamId)?.count ?? 0;
  const max = Math.max(1, ...lobby.teams.map((t) => t.count));

  return (
    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-[1.1vw] md:grid-cols-3">
      {teams.map((team) => {
        const count = countOf(team.id);
        const mine = team.id === myTeamId;
        return (
          <div
            key={team.id}
            className={cn(
              'relative flex min-h-0 flex-col justify-between overflow-hidden rounded-[1.4vw] border p-[1.1vw]',
              mine
                ? 'border-glow/60 bg-glow/[0.08] shadow-[0_0_0_1px_rgba(58,208,255,0.3)]'
                : 'border-white/10 bg-white/[0.055]',
            )}
          >
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/[0.08] to-transparent transition-[height] duration-1000"
              style={{ height: `${Math.min(100, (count / max) * 100)}%` }}
            />
            {mine && (
              <span className="absolute right-[0.8vw] top-[0.8vw] z-10 rounded-full bg-glow px-[0.8vw] py-[0.3vw] text-[clamp(0.7rem,0.9vw,1rem)] font-extrabold tracking-wide text-[#04141f]">
                ТИ ТУТ
              </span>
            )}
            <div className="relative z-[1] flex items-center gap-[1vw]">
              <div
                className="flex h-[clamp(2.2rem,3.2vw,3.8rem)] w-[clamp(2.2rem,3.2vw,3.8rem)] items-center justify-center rounded-full text-[clamp(1.2rem,1.8vw,2.1rem)]"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="text-[clamp(1.1rem,1.7vw,2rem)] font-extrabold leading-tight">{team.name}</div>
            </div>
            <div className="relative z-[1] mt-[0.6vw] font-display text-[clamp(2.2rem,4vw,4.6rem)]">
              {count}
              <small className="mt-[0.15vw] block font-sans tv-label font-bold text-[#8ea2b6]">
                учасників
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
