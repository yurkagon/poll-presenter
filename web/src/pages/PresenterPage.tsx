import { GameProvider, useGame } from '@/context/GameProvider';
import { BigScreen } from '@/components/frames/BigScreen';
import { LobbyView } from './presenter/LobbyView';
import { WaitingView } from './presenter/WaitingView';
import { PodiumView } from './presenter/PodiumView';
import { JuryView } from './presenter/JuryView';
import { LeaderboardView } from './presenter/LeaderboardView';
import { EuroRevealView } from './presenter/EuroRevealView';

function PresenterInner() {
  const { teams, eventTeams, gameState, snapshot, lobby, euro, teamById } = useGame();
  const eventTeamById = (id: string) => eventTeams.find((t) => t.id === id);

  if (gameState.displayMode === 'LEADERBOARD') {
    return <LeaderboardView teams={teams} teamById={(id) => teamById(id)!} />;
  }

  if (gameState.displayMode === 'EVENT' && snapshot) {
    const { event } = snapshot;
    const revealStep =
      euro && euro.eventId === event.id ? euro.step : event.revealStep;
    // Fall back to deriving the phase from revealStep (not just the ephemeral
    // WS `euro` state) so a reload mid-reveal doesn't re-hide already-shown
    // audience scores.
    const euroPhase =
      euro && euro.eventId === event.id
        ? euro.phase
        : revealStep >= eventTeams.length
          ? 'done'
          : 'audience';

    if (event.type === 'EURO') {
      if (event.status === 'OPEN') {
        return <WaitingView snapshot={snapshot} />;
      }
      if (event.status === 'REVEALED' || event.status === 'COMPLETED') {
        return (
          <EuroRevealView snapshot={snapshot} teams={eventTeams} step={revealStep} phase={euroPhase} />
        );
      }
      if (event.status === 'CLOSED') {
        // Voting is closed and hidden — jury announces live, shown as it's entered.
        return <JuryView snapshot={snapshot} teams={eventTeams} />;
      }
    }

    if (event.type === 'SCORE_ENTRY') {
      if (event.status === 'CLOSED' || event.status === 'REVEALED' || event.status === 'COMPLETED') {
        return (
          <PodiumView snapshot={snapshot} teamById={eventTeamById} revealStep={revealStep} />
        );
      }
    }

    // LOBBY / DRAFT → get-ready
    return (
      <BigScreen live="ГОТУЄМОСЬ" title={event.name} subtitle="Скоро почнемо…">
        <div className="flex flex-1 items-center justify-center text-6xl">⏳</div>
      </BigScreen>
    );
  }

  // default: lobby
  return <LobbyView teams={teams} lobby={lobby} />;
}

export function PresenterPage() {
  return (
    <GameProvider role="screen">
      <PresenterInner />
    </GameProvider>
  );
}
