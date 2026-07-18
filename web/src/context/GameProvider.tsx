import * as React from 'react';
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type {
  Team,
  GameState,
  EventSnapshot,
  LobbySnapshot,
  VoteProgress,
  VoteResults,
  JuryScoreDto,
  LeaderboardDto,
  EuroRevealEntry,
  PresenceRole,
} from '@shared/types';
import { api } from '@/lib/api';
import { EV, joinLive, useSocketEvent } from '@/lib/socket';

interface GameContextValue {
  teams: Team[];
  gameState: GameState;
  snapshot: EventSnapshot | null;
  lobby: LobbySnapshot;
  results: VoteResults | null;
  euro: EuroRevealEntry | null;
  leaderboard: LeaderboardDto | null;
  teamById: (id: string | null | undefined) => Team | undefined;
  refresh: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  role,
  deviceId,
  children,
}: {
  role: PresenceRole;
  deviceId?: string;
  children: React.ReactNode;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    displayMode: 'LOBBY',
    activeEventId: null,
  });
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null);
  const [lobby, setLobby] = useState<LobbySnapshot>({ teams: [], totalParticipants: 0 });
  const [results, setResults] = useState<VoteResults | null>(null);
  const [euro, setEuro] = useState<EuroRevealEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDto | null>(null);

  // Load the snapshot the admin actually selected. When a specific event is
  // active we fetch it by id (works for any status, e.g. a DRAFT jury event);
  // otherwise fall back to whatever event is in a live status.
  const loadSnapshotFor = useCallback((state: GameState) => {
    const p =
      state.displayMode === 'EVENT' && state.activeEventId
        ? api.events.snapshot(state.activeEventId)
        : api.events.active();
    p.then(setSnapshot).catch(() => setSnapshot(null));
  }, []);

  const refresh = useCallback(() => {
    api.teams.list().then(setTeams).catch(() => {});
    api.game
      .state()
      .then((s) => {
        setGameState(s);
        loadSnapshotFor(s);
      })
      .catch(() => {});
    api.participants.lobby().then(setLobby).catch(() => {});
    api.leaderboard({ scope: 'overall' }).then(setLeaderboard).catch(() => {});
  }, [loadSnapshotFor]);

  useEffect(() => {
    joinLive(role, deviceId);
    refresh();
  }, [role, deviceId, refresh]);

  useSocketEvent<GameState>(
    EV.GAME_STATE,
    useCallback(
      (s: GameState) => {
        setGameState(s);
        loadSnapshotFor(s);
      },
      [loadSnapshotFor],
    ),
  );
  useSocketEvent<EventSnapshot>(EV.EVENT_STATE, useCallback((s) => setSnapshot(s), []));
  useSocketEvent<LobbySnapshot>(EV.LOBBY_UPDATED, useCallback((l) => setLobby(l), []));
  useSocketEvent<VoteProgress>(
    EV.VOTE_PROGRESS,
    useCallback(
      (p: VoteProgress) =>
        setSnapshot((s) => (s && s.event.id === p.eventId ? { ...s, progress: p } : s)),
      [],
    ),
  );
  useSocketEvent<{ eventId: string; scores: JuryScoreDto[] }>(
    EV.JURY_UPDATED,
    useCallback(
      (j) =>
        setSnapshot((s) =>
          s && s.event.id === j.eventId ? { ...s, jury: j.scores } : s,
        ),
      [],
    ),
  );
  useSocketEvent<VoteResults>(EV.RESULTS_UPDATED, useCallback((r) => setResults(r), []));
  useSocketEvent<LeaderboardDto>(EV.LEADERBOARD_UPDATED, useCallback((l) => setLeaderboard(l), []));
  useSocketEvent<EuroRevealEntry>(EV.EURO_REVEAL, useCallback((e) => setEuro(e), []));

  const teamById = useCallback(
    (id: string | null | undefined) => teams.find((t) => t.id === id),
    [teams],
  );

  return (
    <GameContext.Provider
      value={{ teams, gameState, snapshot, lobby, results, euro, leaderboard, teamById, refresh }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
