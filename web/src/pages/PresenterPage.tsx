import { GameProvider, useGame } from '@/context/GameProvider';
import { BigScreen } from '@/components/frames/BigScreen';
import { LobbyView } from './presenter/LobbyView';
import { WaitingView } from './presenter/WaitingView';
import { PodiumView } from './presenter/PodiumView';
import { JuryView } from './presenter/JuryView';
import { LeaderboardView } from './presenter/LeaderboardView';
import { EuroRevealView } from './presenter/EuroRevealView';

function PresenterInner() {
  const { teams, gameState, snapshot, lobby, results, euro, teamById } = useGame();

  if (gameState.displayMode === 'LEADERBOARD') {
    return <LeaderboardView teams={teams} teamById={(id) => teamById(id)!} />;
  }

  if (gameState.displayMode === 'EVENT' && snapshot) {
    const { event } = snapshot;
    const revealStep =
      euro && euro.eventId === event.id ? euro.step : event.revealStep;
    const euroPhase =
      euro && euro.eventId === event.id ? euro.phase : 'jury';

    if (event.type === 'JURY') {
      return <JuryView snapshot={snapshot} teams={teams} />;
    }
    if (event.type === 'EURO_VOTE' && (event.status === 'REVEALED' || event.status === 'COMPLETED')) {
      return (
        <EuroRevealView snapshot={snapshot} teams={teams} step={revealStep} phase={euroPhase} />
      );
    }
    if (event.status === 'OPEN') {
      return <WaitingView snapshot={snapshot} />;
    }
    if (event.status === 'CLOSED' || event.status === 'REVEALED' || event.status === 'COMPLETED') {
      return (
        <PodiumView
          snapshot={snapshot}
          results={results}
          teamById={(id) => teamById(id)!}
          revealStep={revealStep}
        />
      );
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
