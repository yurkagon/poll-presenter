import { io, Socket } from 'socket.io-client';
import type { Session, SessionResults } from '@shared/types';
import { WS_EVENTS } from '@shared/types';

const socket: Socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });

export function joinSession(sessionCode: string) {
  socket.emit(WS_EVENTS.JOIN_SESSION, { sessionCode });
}

export function onResultsUpdated(cb: (results: SessionResults) => void) {
  socket.on(WS_EVENTS.RESULTS_UPDATED, cb);
  return () => socket.off(WS_EVENTS.RESULTS_UPDATED, cb);
}

export function onQuestionChanged(
  cb: (payload: { session: Session; results: SessionResults }) => void,
) {
  socket.on(WS_EVENTS.QUESTION_CHANGED, cb);
  return () => socket.off(WS_EVENTS.QUESTION_CHANGED, cb);
}

export function onSessionReset(
  cb: (payload: { session: Session; results: SessionResults }) => void,
) {
  socket.on(WS_EVENTS.SESSION_RESET, cb);
  return () => socket.off(WS_EVENTS.SESSION_RESET, cb);
}

export { socket };
