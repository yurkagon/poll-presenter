import { useState } from 'react';
import type { Team, EventDto } from '@shared/types';
import { PhoneScreen } from '@/components/frames/PhoneScreen';
import { TeamCard } from '@/components/team/TeamCard';
import { EuroSlots } from '@/components/vote/EuroSlots';
import { Button } from '@/components/ui/button';
import { useParticipant } from '@/context/ParticipantProvider';

const MEDALS = ['🥇', '🥈', '🥉'];

export function EuroVoteView({
  event,
  teams,
  myTeamId,
}: {
  event: EventDto;
  teams: Team[];
  myTeamId: string | null;
}) {
  const { castEuroVote } = useParticipant();
  const [ranking, setRanking] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const mine = teams.find((t) => t.id === myTeamId);

  const toggle = (teamId: string) => {
    setRanking((r) => {
      const idx = r.indexOf(teamId);
      if (idx !== -1) return r.filter((x) => x !== teamId);
      if (r.length >= 3) return r;
      return [...r, teamId];
    });
  };

  const confirm = async () => {
    if (ranking.length !== 3) return;
    setBusy(true);
    try {
      await castEuroVote(event.id, ranking);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneScreen
      tag={`${event.name} · Голосування`}
      title="Роздай свої бали"
      cta={
        <Button
          className="w-full bg-accent-green text-white"
          size="lg"
          disabled={ranking.length !== 3 || busy}
          onClick={confirm}
        >
          Підтвердити бали →
        </Button>
      }
    >
      <div className="ef-glass mb-3 rounded-2xl p-3.5 text-[12.5px] font-semibold text-ink-soft">
        Обери 3 виступи від 🥇 найкращого до 🥉 третього. Твоя команда —{' '}
        <b className="text-ink">{mine?.icon} {mine?.name}</b> — участі не бере.
      </div>

      <EuroSlots ranking={ranking} teamById={(id) => teams.find((t) => t.id === id)} />

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {teams.map((team) => {
          const isMine = team.id === myTeamId;
          const rankIdx = ranking.indexOf(team.id);
          const isRanked = rankIdx !== -1;
          const isFull = ranking.length >= 3 && !isRanked;
          return (
            <TeamCard
              key={team.id}
              team={team}
              state={isMine || isFull ? 'disabled' : isRanked ? 'ranked' : 'default'}
              medal={isRanked ? MEDALS[rankIdx] : undefined}
              onClick={() => toggle(team.id)}
            />
          );
        })}
      </div>
    </PhoneScreen>
  );
}
