// Shared contract between the NestJS backend (imported by relative path) and
// the React frontend (imported as `@shared`). Frontend imports are type-only,
// so enums are `as const` unions here — NOT Prisma runtime enums.

// ─── Enums (mirror Prisma enums) ───────────────────────────────────────────────

export type EventCategory = 'PUNCT' | 'SPORT' | 'CREATIVE' | 'GENERAL';
export type EventType = 'SCORE_ENTRY' | 'EURO';
export type EventWeight = 'NORMAL' | 'BIG' | 'KEY';
export type ParticipantMode = 'TEAMS' | 'ADHOC';
export type EventStatus =
  | 'DRAFT'
  | 'LOBBY'
  | 'OPEN'
  | 'CLOSED'
  | 'REVEALED'
  | 'COMPLETED';
export type DisplayMode = 'LOBBY' | 'EVENT' | 'LEADERBOARD' | 'IDLE';

// ─── Domain types ──────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex
  order: number;
  eventId?: string | null; // set for ad-hoc teams scoped to one event
}

export interface Participant {
  id: string;
  deviceId: string;
  name: string | null;
  teamId: string | null;
}

export interface Day {
  id: string;
  label: string;
  order: number;
}

export interface EventDto {
  id: string;
  name: string;
  dayId: string | null;
  category: EventCategory;
  type: EventType;
  weight: EventWeight;
  participantMode: ParticipantMode;
  affectsScore: boolean;
  status: EventStatus;
  revealStep: number;
}

export interface EventResultData {
  placement: string[]; // ordered teamIds, best..worst
  scores?: Record<string, number> | null;
  audienceRaw?: Record<string, number> | null;
  /** Distinct audience voters — used to normalize audienceRaw to a 0..12 score. */
  audienceVoters?: number | null;
  juryRaw?: Record<string, number> | null;
  computedPoints: Record<string, number>;
}

/** Full snapshot the presenter/phone render for a single event. */
export interface EventSnapshot {
  event: EventDto;
  result: EventResultData | null;
  jury: JuryScoreDto[];
  progress: VoteProgress;
}

export interface JuryScoreDto {
  teamId: string;
  points: number;
}

export interface GameState {
  displayMode: DisplayMode;
  activeEventId: string | null;
}

// ─── Realtime payloads (server → clients) ───────────────────────────────────────

export interface LobbyTeamCount {
  teamId: string;
  count: number;
}

export interface LobbySnapshot {
  teams: LobbyTeamCount[];
  totalParticipants: number;
}

export interface VoteProgress {
  eventId: string;
  totalVotes: number;
  expected: number | null;
}

export interface EuroAllocation {
  teamId: string;
  points: number;
}

export interface EuroRevealEntry {
  eventId: string;
  step: number;
  phase: 'audience' | 'done';
}

export interface LeaderboardRow {
  teamId: string;
  name: string;
  points: number;
  rank: number;
  perCategory?: Record<EventCategory, number>;
  rankChange?: number; // prevRank - rank (positive = moved up)
}

export interface LeaderboardDto {
  scope: 'overall' | 'day' | 'category';
  rows: LeaderboardRow[];
}

// ─── API request payloads (client → server) ─────────────────────────────────────

export interface UpsertParticipantPayload {
  deviceId: string;
  name?: string;
}

export interface SelectTeamPayload {
  teamId: string;
}

export interface CreateTeamPayload {
  name: string;
  icon: string;
  color: string;
  order?: number;
  eventId?: string;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

export interface CreateEventPayload {
  name: string;
  dayId?: string | null;
  category: EventCategory;
  type: EventType;
  weight: EventWeight;
  participantMode: ParticipantMode;
  affectsScore: boolean;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface CastEuroVotePayload {
  deviceId: string;
  ranking: string[]; // exactly 3 distinct teamIds, none the voter's own
}

export interface EnterResultPayload {
  scores?: Record<string, number>;
  juryRaw?: Record<string, number>;
  audienceRaw?: Record<string, number>;
}

export interface SetJuryPayload {
  teamId: string;
  score: number; // 0..12
}

export interface SetDisplayPayload {
  displayMode: DisplayMode;
  activeEventId?: string | null;
}

export interface LeaderboardFilters {
  scope?: 'overall' | 'day' | 'category';
  dayId?: string;
  category?: EventCategory;
  mode?: 'cumulative' | 'single';
}

// ─── Scoring constants (shared so the frontend can preview identical numbers) ───

// Flatter than a "12..1" ladder on purpose — the podium still stands out,
// but last place isn't crushed, especially once a KEY (×2) event multiplies it.
export const BASE_POINTS = [12, 10, 9, 8, 7, 6, 5] as const;
export const WEIGHT_MULTIPLIER: Record<EventWeight, number> = {
  NORMAL: 1,
  BIG: 1.5,
  KEY: 2,
};

// ─── WebSocket events ────────────────────────────────────────────────────────

export const WS_EVENTS = {
  PRESENCE_JOIN: 'presence:join',
  GAME_STATE: 'game:state',
  EVENT_STATE: 'event:state',
  LOBBY_UPDATED: 'lobby:updated',
  VOTE_PROGRESS: 'vote:progress',
  JURY_UPDATED: 'jury:updated',
  LEADERBOARD_UPDATED: 'leaderboard:updated',
  EURO_REVEAL: 'euro:reveal',
} as const;

export type PresenceRole = 'presenter' | 'screen' | 'participant';

export interface PresenceJoinPayload {
  role: PresenceRole;
  deviceId?: string;
}
