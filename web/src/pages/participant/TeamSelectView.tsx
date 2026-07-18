import { useState } from 'react';
import type { Team } from '@shared/types';
import { PhoneScreen } from '@/components/frames/PhoneScreen';
import { TeamCard } from '@/components/team/TeamCard';
import { Button } from '@/components/ui/button';
import { useParticipant } from '@/context/ParticipantProvider';

export function TeamSelectView({ teams }: { teams: Team[] }) {
  const { pickTeam } = useParticipant();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await pickTeam(selected);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneScreen
      tag="Обери свій загін"
      title="Обери команду"
      cta={
        <Button
          className="w-full bg-ink text-white"
          size="lg"
          disabled={!selected || busy}
          onClick={confirm}
        >
          Продовжити →
        </Button>
      }
    >
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            state={selected === team.id ? 'selected' : 'default'}
            onClick={() => setSelected(team.id)}
          />
        ))}
      </div>
    </PhoneScreen>
  );
}
