import { useCallback, useEffect, useState } from 'react';
import type { PrayerPollState, PresenceRole } from '@shared/types';
import { api } from '@/lib/api';
import { EV, joinLive, socket, useSocketEvent } from '@/lib/socket';

/** Live prayer-poll state: initial fetch, socket pushes, and a refetch after reconnects. */
export function usePrayerPoll(role: PresenceRole) {
  const [state, setState] = useState<PrayerPollState | null>(null);

  useEffect(() => {
    const load = () => api.prayerPoll.state().then(setState).catch(() => {});
    load();
    joinLive(role);
    socket.on('connect', load);
    return () => {
      socket.off('connect', load);
    };
  }, [role]);

  useSocketEvent<PrayerPollState>(EV.PRAYER_POLL_STATE, useCallback((s) => setState(s), []));

  return { state, setState };
}
