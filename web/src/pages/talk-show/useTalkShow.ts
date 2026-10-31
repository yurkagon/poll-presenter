import { useCallback, useEffect, useState } from 'react';
import { TALK_SHOW_EVENTS, type TalkShowState } from '@shared/talk-show';
import { talkShowApi } from '@/lib/talk-show-api';
import { socket } from '@/lib/socket';

/**
 * Live public state: initial fetch, socket pushes, and a refetch after every
 * (re)connect so nothing is missed while a phone was offline.
 */
export function useTalkShow(deviceId?: string) {
  const [state, setState] = useState<TalkShowState | null>(null);

  const load = useCallback(
    () => talkShowApi.state(deviceId).then(setState).catch(() => {}),
    [deviceId],
  );

  useEffect(() => {
    const join = () => {
      socket.emit(TALK_SHOW_EVENTS.JOIN);
      load();
    };
    const onState = (next: TalkShowState) =>
      // Pushes are device-agnostic — keep this device's own vote.
      setState((prev) => ({ ...next, myVote: prev?.poll?.id === next.poll?.id ? prev?.myVote : null }));

    if (socket.connected) join();
    socket.on('connect', join);
    socket.on(TALK_SHOW_EVENTS.STATE, onState);
    return () => {
      socket.off('connect', join);
      socket.off(TALK_SHOW_EVENTS.STATE, onState);
    };
  }, [load]);

  return { state, setState, reload: load };
}
