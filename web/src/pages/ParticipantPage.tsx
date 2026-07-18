import { ensureDeviceId } from '@/lib/identity';
import { GameProvider, useGame } from '@/context/GameProvider';
import { ParticipantProvider, useParticipant } from '@/context/ParticipantProvider';
import { TeamSelectView } from './participant/TeamSelectView';
import { SimpleVoteView } from './participant/SimpleVoteView';
import { EuroVoteView } from './participant/EuroVoteView';
import { PhoneStatus } from './participant/PhoneStatus';

function ParticipantInner() {
  const { teams, snapshot, teamById } = useGame();
  const { ready, myTeamId, hasVotedFor } = useParticipant();
  const myTeam = teamById(myTeamId);

  if (!ready || teams.length === 0) {
    return <PhoneStatus title="Завантаження…" message="Хвилинку" />;
  }

  if (!myTeamId) {
    return <TeamSelectView teams={teams} />;
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
    if (event.type === 'SIMPLE_VOTE' || event.type === 'HYBRID') {
      return <SimpleVoteView event={event} teams={teams} myTeamId={myTeamId} />;
    }
    if (event.type === 'EURO_VOTE') {
      return <EuroVoteView event={event} teams={teams} myTeamId={myTeamId} />;
    }
  }

  return (
    <PhoneStatus
      tag="єФрендшіп"
      title="Ти в грі!"
      message="Стеж за спільним екраном — ведучий скоро запустить наступний етап."
      team={myTeam}
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
