import type {
  TalkShowAdminState,
  TalkShowCreatePollPayload,
  TalkShowOption,
  TalkShowScreenMode,
  TalkShowState,
} from '@shared/talk-show';

const BASE = '/api/talk-show';

export class TalkShowApiError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new TalkShowApiError(res.status, body.message ?? res.statusText, body.retryAfterMs);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const talkShowApi = {
  // audience
  state: (deviceId?: string) =>
    request<TalkShowState>(`/state${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`),
  vote: (deviceId: string, pollId: string, option: TalkShowOption) =>
    post<TalkShowState>('/votes', { deviceId, pollId, option }),
  ask: (deviceId: string, text: string) => post<TalkShowState>('/questions', { deviceId, text }),

  // host session
  login: (password: string) => post<{ ok: true }>('/auth/login', { password }),
  logout: () => post<{ ok: true }>('/auth/logout'),
  me: () => request<{ ok: true }>('/auth/me'),

  // host controls
  adminState: () => request<TalkShowAdminState>('/admin/state'),
  createPoll: (payload: TalkShowCreatePollPayload) =>
    post<TalkShowAdminState>('/admin/polls', payload),
  startPoll: (id: string) => post<TalkShowAdminState>(`/admin/polls/${id}/start`),
  closePoll: (id: string) => post<TalkShowAdminState>(`/admin/polls/${id}/close`),
  startNext: () => post<TalkShowAdminState>('/admin/polls/next'),
  deletePoll: (id: string) => request<TalkShowAdminState>(`/admin/polls/${id}`, { method: 'DELETE' }),
  setResultsVisible: (visible: boolean) =>
    post<TalkShowAdminState>('/admin/results-visible', { visible }),
  setScreenMode: (mode: TalkShowScreenMode) =>
    post<TalkShowAdminState>('/admin/screen-mode', { mode }),
  featureQuestion: (id: string | null) =>
    post<TalkShowAdminState>('/admin/questions/feature', { id }),
  setQuestionHidden: (id: string, hidden: boolean) =>
    post<TalkShowAdminState>(`/admin/questions/${id}/hidden`, { hidden }),
  deleteQuestion: (id: string) =>
    request<TalkShowAdminState>(`/admin/questions/${id}`, { method: 'DELETE' }),
  finish: () => post<TalkShowAdminState>('/admin/finish'),
  reset: () => post<TalkShowAdminState>('/admin/reset'),
};
