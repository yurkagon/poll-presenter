import type {
  Session,
  SessionResults,
  VotePayload,
  SetQuestionPayload,
} from '@shared/types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getSession: (code: string) => request<Session>(`/session/${code}`),

  getResults: (code: string) => request<SessionResults>(`/session/${code}/results`),

  castVote: (code: string, payload: VotePayload) =>
    request<SessionResults>(`/session/${code}/vote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setQuestion: (code: string, payload: SetQuestionPayload) =>
    request<Session>(`/session/${code}/question`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
