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
    <div className="grid flex-1 grid-cols-2 gap-3.5 md:grid-cols-4">
      {teams.map((team) => {
        const count = countOf(team.id);
        const mine = team.id === myTeamId;
        return (
          <div
            key={team.id}
            className={cn(
              'relative flex flex-col justify-between overflow-hidden rounded-[18px] border p-4',
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
              <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-glow px-2 py-[3px] text-[9.5px] font-extrabold tracking-wide text-[#04141f]">
                ТИ ТУТ
              </span>
            )}
            <div className="relative z-[1] flex items-center gap-2.5">
              <div
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="text-[12.5px] font-bold leading-tight">{team.name}</div>
            </div>
            <div className="relative z-[1] mt-3.5 font-display text-3xl">
              {count}
              <small className="mt-0.5 block font-sans text-[11px] font-bold text-[#8ea2b6]">
                учасників
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
