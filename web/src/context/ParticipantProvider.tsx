import * as React from 'react';
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { Participant } from '@shared/types';
import { api } from '@/lib/api';
import { ensureDeviceId, markVoted, loadVotedEventIds } from '@/lib/identity';

interface ParticipantContextValue {
  deviceId: string;
  participant: Participant | null;
  myTeamId: string | null;
  ready: boolean;
  pickTeam: (teamId: string) => Promise<void>;
  castEuroVote: (eventId: string, ranking: string[]) => Promise<void>;
  hasVotedFor: (eventId: string) => boolean;
}

const Ctx = createContext<ParticipantContextValue | null>(null);

export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [deviceId] = useState(() => ensureDeviceId());
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [ready, setReady] = useState(false);
  // Kept in React state (not just localStorage) so the UI switches to the
  // "voted" screen immediately after a vote, without a reload.
  const [votedEvents, setVotedEvents] = useState<Set<string>>(
    () => new Set(loadVotedEventIds()),
  );

  useEffect(() => {
    let alive = true;
    api.participants
      .join(deviceId)
      .then((p) => alive && setParticipant(p))
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [deviceId]);

  const pickTeam = useCallback(
    async (teamId: string) => {
      const p = await api.participants.selectTeam(deviceId, teamId);
      setParticipant(p);
    },
    [deviceId],
  );

  const rememberVote = useCallback((eventId: string) => {
    markVoted(eventId);
    setVotedEvents((prev) => new Set(prev).add(eventId));
  }, []);

  const castEuroVote = useCallback(
    async (eventId: string, ranking: string[]) => {
      await api.votes.castEuro(eventId, deviceId, ranking);
      rememberVote(eventId);
    },
    [deviceId, rememberVote],
  );

  const hasVotedFor = useCallback(
    (eventId: string) => votedEvents.has(eventId),
    [votedEvents],
  );

  return (
    <Ctx.Provider
      value={{
        deviceId,
        participant,
        myTeamId: participant?.teamId ?? null,
        ready,
        pickTeam,
        castEuroVote,
        hasVotedFor,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useParticipant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useParticipant must be used within ParticipantProvider');
  return ctx;
}
