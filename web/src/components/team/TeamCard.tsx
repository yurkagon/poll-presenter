import type { Team } from '@shared/types';
import { cn } from '@/lib/utils';

type TeamCardState = 'default' | 'selected' | 'disabled' | 'voted' | 'ranked';

interface TeamCardProps {
  team: Team;
  state?: TeamCardState;
  medal?: string;
  onClick?: () => void;
}

/** The tappable team card used on team-select and voting screens. */
export function TeamCard({ team, state = 'default', medal, onClick }: TeamCardProps) {
  const selected = state === 'selected' || state === 'ranked';
  const voted = state === 'voted';
  const disabled = state === 'disabled';

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'relative flex min-h-[118px] flex-col justify-between rounded-[20px] border p-4 text-left transition-all active:scale-[0.97]',
        !selected && !voted && 'ef-glass',
        selected && 'border-transparent bg-ink text-white',
        voted && 'border-transparent bg-accent-blue text-white',
        disabled && 'pointer-events-none opacity-35',
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-9 w-9 items-center justify-center rounded-full text-lg',
          selected || voted ? 'bg-white/25' : 'bg-ink text-white',
        )}
      >
        {team.icon}
      </div>
      <div className="text-[13.5px] font-bold leading-tight">{team.name}</div>

      {state === 'selected' && (
        <span className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-green text-[11px] font-extrabold text-white">
          ✓
        </span>
      )}
      {state === 'ranked' && medal && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-ink shadow-md">
          {medal}
        </span>
      )}
    </button>
  );
}
