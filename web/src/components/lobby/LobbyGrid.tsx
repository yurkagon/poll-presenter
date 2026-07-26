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
    <div className="grid flex-1 grid-cols-2 gap-[1.1vw] md:grid-cols-4">
      {teams.map((team) => {
        const count = countOf(team.id);
        const mine = team.id === myTeamId;
        return (
          <div
            key={team.id}
            className={cn(
              'relative flex flex-col justify-between overflow-hidden rounded-[1.4vw] border p-[1.1vw]',
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
            <div className="relative z-[1] flex items-center gap-[0.9vw]">
              <div
                className="flex h-[clamp(1.8rem,2.6vw,3rem)] w-[clamp(1.8rem,2.6vw,3rem)] items-center justify-center rounded-full text-[clamp(1rem,1.4vw,1.6rem)]"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="tv-body font-bold leading-tight">{team.name}</div>
            </div>
            <div className="relative z-[1] mt-[0.5vw] font-display text-[clamp(1.8rem,3.4vw,3.8rem)]">
              {count}
              <small className="mt-[0.1vw] block font-sans tv-label font-bold text-[#8ea2b6]">
                учасників
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
