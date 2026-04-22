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

export interface Session {
  code: string;
  questions: SessionQuestion[];
  activeQuestionId: string;
  resetVersion: number;
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

export interface SetQuestionPayload {
  questionId: string;
}

// ─── WebSocket events ─────────────────────────────────────────────────────────

export const WS_EVENTS = {
  JOIN_SESSION: 'join_session',
  RESULTS_UPDATED: 'results_updated',
  QUESTION_CHANGED: 'question_changed',
  SESSION_RESET: 'session_reset',
} as const;
