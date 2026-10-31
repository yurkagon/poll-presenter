// ─── Talk show mode ──────────────────────────────────────────────────────────
// Independent of the conference session in ./types.ts: one show, either/or
// polls plus anonymous audience questions.

export const TALK_SHOW_POLL_TEXT_MAX = 300;
export const TALK_SHOW_OPTION_MAX = 60;
export const TALK_SHOW_QUESTION_MAX = 500;
export const TALK_SHOW_QUESTION_COOLDOWN_MS = 10_000;

export type TalkShowPollStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type TalkShowScreenMode = 'VOTING' | 'QUESTIONS' | 'QR';
export type TalkShowOption = 'a' | 'b';

export interface TalkShowPoll {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  status: TalkShowPollStatus;
}

export interface TalkShowCounts {
  a: number;
  b: number;
  total: number;
}

export interface TalkShowQuestion {
  id: string;
  text: string;
  createdAt: number;
}

/** Public snapshot: what the screen and phones may see. */
export interface TalkShowState {
  finished: boolean;
  screenMode: TalkShowScreenMode;
  /** Poll currently on screen. */
  poll: TalkShowPoll | null;
  resultsVisible: boolean;
  /** `null` while the host keeps results hidden (counts never leave the server). */
  results: TalkShowCounts | null;
  /** Visible questions, newest first. */
  questions: TalkShowQuestion[];
  featuredQuestion: TalkShowQuestion | null;
  /** Only set on `GET /talk-show/state?deviceId=` — this device's vote on `poll`. */
  myVote?: TalkShowOption | null;
}

export interface TalkShowAdminPoll extends TalkShowPoll {
  counts: TalkShowCounts;
}

export interface TalkShowAdminQuestion extends TalkShowQuestion {
  hidden: boolean;
}

/** Host snapshot: everything, including hidden questions and live counts. */
export interface TalkShowAdminState extends TalkShowState {
  polls: TalkShowAdminPoll[];
  allQuestions: TalkShowAdminQuestion[];
}

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface TalkShowLoginPayload {
  password: string;
}

export interface TalkShowCreatePollPayload {
  text: string;
  optionA: string;
  optionB: string;
}

export interface TalkShowVotePayload {
  deviceId: string;
  pollId: string;
  option: TalkShowOption;
}

export interface TalkShowAskPayload {
  deviceId: string;
  text: string;
}

// ─── WebSocket events ────────────────────────────────────────────────────────

export const TALK_SHOW_EVENTS = {
  JOIN: 'talkshow:join',
  STATE: 'talkshow:state',
} as const;
