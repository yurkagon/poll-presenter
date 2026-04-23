// ─── Session ─────────────────────────────────────────────────────────────────

export interface SessionOption {
  id: string;
  label: string;
}

export interface SessionQuestion {
  id: string;
  text: string;
  options: SessionOption[];  // per-question options
}

export type Theme = 'light' | 'dark';

export interface Session {
  code: string;
  questions: SessionQuestion[];
  activeQuestionId: string;
  subSession: string;
  theme: Theme;
  resultsVisible: boolean;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface VoteResult {
  optionId: string;
  label: string;
  count: number;
}

export interface SessionResults {
  sessionCode: string;
  activeQuestionId: string;
  results: VoteResult[];
  totalVotes: number;
}

// ─── API payloads ─────────────────────────────────────────────────────────────

export interface VotePayload {
  optionId: string;
}

export interface RevotePayload {
  fromOptionId: string;
  toOptionId: string;
}

export interface SetThemePayload {
  theme: Theme;
}

export interface SetQuestionPayload {
  questionId: string;
}

// ─── WebSocket events ─────────────────────────────────────────────────────────

export const WS_EVENTS = {
  JOIN_SESSION: 'join_session',
  RESULTS_UPDATED: 'results_updated',
  QUESTION_CHANGED: 'question_changed',
  SESSION_RESET: 'session_reset',
  THEME_CHANGED: 'theme_changed',
  RESULTS_REVEALED: 'results_revealed',
} as const;
