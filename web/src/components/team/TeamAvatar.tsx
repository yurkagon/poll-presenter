import type { Team } from '@shared/types';
import { cn } from '@/lib/utils';

export function TeamAvatar({
  team,
  size = 38,
  className,
}: {
  team: Pick<Team, 'icon' | 'color'>;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-full', className)}
      style={{ background: team.color, width: size, height: size, fontSize: size * 0.5 }}
    >
      {team.icon}
    </div>
  );
}
