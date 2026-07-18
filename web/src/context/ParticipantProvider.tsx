import * as React from 'react';
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { Participant } from '@shared/types';
import { api } from '@/lib/api';
import { ensureDeviceId, markVoted, hasVoted } from '@/lib/identity';

interface ParticipantContextValue {
  deviceId: string;
  participant: Participant | null;
  myTeamId: string | null;
  ready: boolean;
  pickTeam: (teamId: string) => Promise<void>;
  castVote: (eventId: string, targetTeamId: string) => Promise<void>;
  castEuroVote: (eventId: string, ranking: string[]) => Promise<void>;
  hasVotedFor: (eventId: string) => boolean;
}

const Ctx = createContext<ParticipantContextValue | null>(null);

export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [deviceId] = useState(() => ensureDeviceId());
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [ready, setReady] = useState(false);

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

  const castVote = useCallback(
    async (eventId: string, targetTeamId: string) => {
      await api.votes.cast(eventId, deviceId, targetTeamId);
      markVoted(eventId);
    },
    [deviceId],
  );

  const castEuroVote = useCallback(
    async (eventId: string, ranking: string[]) => {
      await api.votes.castEuro(eventId, deviceId, ranking);
      markVoted(eventId);
    },
    [deviceId],
  );

  return (
    <Ctx.Provider
      value={{
        deviceId,
        participant,
        myTeamId: participant?.teamId ?? null,
        ready,
        pickTeam,
        castVote,
        castEuroVote,
        hasVotedFor: hasVoted,
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
