import { useState } from 'react';
import type { Team } from '@shared/types';
import { PhoneScreen } from '@/components/frames/PhoneScreen';
import { TeamCard } from '@/components/team/TeamCard';
import { Button } from '@/components/ui/button';
import { useParticipant } from '@/context/ParticipantProvider';

export function TeamSelectView({
  teams,
  currentTeamId,
  onDone,
}: {
  teams: Team[];
  /** When set, the view is in "change team" mode: pre-selects and can be cancelled. */
  currentTeamId?: string | null;
  onDone?: () => void;
}) {
  const { pickTeam } = useParticipant();
  const changing = currentTeamId != null;
  const [selected, setSelected] = useState<string | null>(currentTeamId ?? null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await pickTeam(selected);
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneScreen
      tag={changing ? 'Зміна команди' : 'Обери свій загін'}
      title={changing ? 'Зміни команду' : 'Обери команду'}
      cta={
        <Button
          className="w-full bg-ink text-white"
          size="lg"
          disabled={!selected || busy}
          onClick={confirm}
        >
          {changing ? 'Зберегти команду' : 'Продовжити →'}
        </Button>
      }
    >
      {changing && onDone && (
        <button
          type="button"
          onClick={onDone}
          className="mb-2 text-[13px] font-bold text-accent-blue"
        >
          ← Назад
        </button>
      )}
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
