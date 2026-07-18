import { useState } from 'react';
import type { Team, EventDto } from '@shared/types';
import { PhoneScreen } from '@/components/frames/PhoneScreen';
import { TeamCard } from '@/components/team/TeamCard';
import { Button } from '@/components/ui/button';
import { useParticipant } from '@/context/ParticipantProvider';

export function SimpleVoteView({
  event,
  teams,
  myTeamId,
}: {
  event: EventDto;
  teams: Team[];
  myTeamId: string | null;
}) {
  const { castVote } = useParticipant();
  const [target, setTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = teams.find((t) => t.id === myTeamId);

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await castVote(event.id, target);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneScreen
      tag={`${event.name} · Голосування`}
      title="За кого голосуєш?"
      cta={
        <Button
          className="w-full bg-accent-green text-white"
          size="lg"
          disabled={!target || busy}
          onClick={confirm}
        >
          Підтвердити голос →
        </Button>
      }
    >
      {mine && (
        <div className="ef-glass mb-3.5 rounded-2xl p-3.5 text-[12.5px] font-semibold text-ink-soft">
          Твоя команда — <b className="text-ink">{mine.icon} {mine.name}</b>. За себе
          проголосувати не можна.
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {teams.map((team) => {
          const isMine = team.id === myTeamId;
          return (
            <TeamCard
              key={team.id}
              team={team}
              state={isMine ? 'disabled' : target === team.id ? 'voted' : 'default'}
              onClick={() => setTarget(team.id)}
            />
          );
        })}
      </div>
    </PhoneScreen>
  );
}
