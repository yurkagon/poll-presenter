import type { Team } from '@shared/types';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];

export function EuroSlots({
  ranking,
  teamById,
}: {
  ranking: string[];
  teamById: (id: string) => Team | undefined;
}) {
  return (
    <div className="mt-0.5 flex gap-2">
      {MEDALS.map((medal, i) => {
        const team = ranking[i] ? teamById(ranking[i]) : undefined;
        return (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-xl border p-2.5 text-center text-[11px] font-bold',
              team ? 'border-transparent bg-ink text-white' : 'ef-glass text-ink-faint',
            )}
          >
            <span className="mb-0.5 block text-[15px]">{medal}</span>
            {team ? team.name : 'Порожньо'}
          </div>
        );
      })}
    </div>
  );
}
