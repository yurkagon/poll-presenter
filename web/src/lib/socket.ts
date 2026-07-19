import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import type {
  GameState,
  EventSnapshot,
  LobbySnapshot,
  VoteProgress,
  JuryScoreDto,
  LeaderboardDto,
  EuroRevealEntry,
  PresenceRole,
} from '@shared/types';
import { WS_EVENTS } from '@shared/types';

const socket: Socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });

export function joinLive(role: PresenceRole, deviceId?: string) {
  const emit = () => socket.emit(WS_EVENTS.PRESENCE_JOIN, { role, deviceId });
  if (socket.connected) emit();
  socket.on('connect', emit);
}

/** Subscribe to a socket event for the lifetime of a React component. */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  useEffect(() => {
    socket.on(event, handler as (p: unknown) => void);
    return () => {
      socket.off(event, handler as (p: unknown) => void);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, handler]);
}

export const EV = WS_EVENTS;

export type {
  GameState,
  EventSnapshot,
  LobbySnapshot,
  VoteProgress,
  JuryScoreDto,
  LeaderboardDto,
  EuroRevealEntry,
};

export { socket };
