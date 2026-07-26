import { useState } from 'react';
import { ensureDeviceId } from '@/lib/identity';
import { GameProvider, useGame } from '@/context/GameProvider';
import { ParticipantProvider, useParticipant } from '@/context/ParticipantProvider';
import { TeamSelectView } from './participant/TeamSelectView';
import { EuroVoteView } from './participant/EuroVoteView';
import { PhoneStatus } from './participant/PhoneStatus';

function ParticipantInner() {
  const { teams, eventTeams, snapshot, teamById } = useGame();
  const { ready, myTeamId, hasVotedFor } = useParticipant();
  const [changing, setChanging] = useState(false);
  const myTeam = teamById(myTeamId);

  if (!ready || teams.length === 0) {
    return <PhoneStatus title="Завантаження…" message="Хвилинку" />;
  }

  // First-time pick, or the participant chose to change their team.
  if (!myTeamId) {
    return <TeamSelectView teams={teams} />;
  }
  if (changing) {
    return (
      <TeamSelectView
        teams={teams}
        currentTeamId={myTeamId}
        onDone={() => setChanging(false)}
      />
    );
  }

  const event = snapshot?.event;
  const votingOpen = event && event.status === 'OPEN';

  if (event && votingOpen) {
    if (hasVotedFor(event.id)) {
      return (
        <PhoneStatus
          tag={event.name}
          title="Голос прийнято!"
          message="Дякуємо — стеж за спільним екраном, поки голосують інші."
          team={myTeam}
        />
      );
    }
    if (event.type === 'EURO') {
      const voteTargets = event.participantMode === 'ADHOC' ? eventTeams : teams;
      return <EuroVoteView event={event} teams={voteTargets} myTeamId={myTeamId} />;
    }
  }

  return (
    <PhoneStatus
      tag="єФрендшіп"
      title="Ти в грі!"
      message="Стеж за спільним екраном — ведучий скоро запустить наступний етап."
      team={myTeam}
      action={
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="rounded-full border border-accent-blue/40 px-6 py-3 text-[15px] font-bold text-accent-blue transition-colors hover:bg-accent-blue/5"
        >
          Змінити команду
        </button>
      }
    />
  );
}

export function ParticipantPage() {
  const deviceId = ensureDeviceId();
  return (
    <ParticipantProvider>
      <GameProvider role="participant" deviceId={deviceId}>
        <ParticipantInner />
      </GameProvider>
    </ParticipantProvider>
  );
}
