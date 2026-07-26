import type { ReactNode } from 'react';
import type { Team } from '@shared/types';
import { PhoneScreen } from '@/components/frames/PhoneScreen';
import { TeamAvatar } from '@/components/team/TeamAvatar';

export function PhoneStatus({
  tag,
  title,
  message,
  team,
  action,
}: {
  tag?: string;
  title: string;
  message: string;
  team?: Team | null;
  action?: ReactNode;
}) {
  return (
    <PhoneScreen tag={tag ?? 'єФрендшіп'} title={title}>
      <div className="mt-10 flex flex-col items-center gap-5 text-center">
        {team && (
          <div className="flex flex-col items-center gap-2">
            <TeamAvatar team={team} size={64} />
            <div className="text-sm font-bold text-ink">{team.name}</div>
          </div>
        )}
        <p className="max-w-xs text-[15px] font-semibold text-ink-soft">{message}</p>
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 animate-bounce2 rounded-full bg-accent-blue" />
          <span
            className="h-2.5 w-2.5 animate-bounce2 rounded-full bg-accent-blue"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="h-2.5 w-2.5 animate-bounce2 rounded-full bg-accent-blue"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </PhoneScreen>
  );
}
