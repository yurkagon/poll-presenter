import type {
  Team,
  Participant,
  Day,
  EventDto,
  EventSnapshot,
  LobbySnapshot,
  VoteProgress,
  VoteResults,
  JuryScoreDto,
  LeaderboardDto,
  GameState,
  EventStatus,
  CreateTeamPayload,
  UpdateTeamPayload,
  CreateEventPayload,
  EnterResultPayload,
  LeaderboardFilters,
} from '@shared/types';

const BASE = '/api';

// Single in-flight refresh shared by concurrent 401s.
let refreshPromise: Promise<boolean> | null = null;
function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false);
    // Clear once settled so the next expiry can refresh again.
    refreshPromise.finally(() => {
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  // Access token expired but a valid refresh cookie may still exist —
  // silently rotate it once and retry, so the admin isn't bounced to login.
  if (
    res.status === 401 &&
    !retried &&
    path !== '/auth/refresh' &&
    path !== '/auth/login'
  ) {
    if (await tryRefresh()) {
      return request<T>(path, init, true);
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const post = (path: string, body?: unknown) =>
  request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const patch = (path: string, body: unknown) =>
  request(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = (path: string) => request(path, { method: 'DELETE' });

export const api = {
  auth: {
    login: (nickname: string, password: string) =>
      post('/auth/login', { nickname, password }),
    logout: () => post('/auth/logout'),
    me: () => request<{ id: string; nickname: string; role: string }>('/auth/me'),
  },

  game: {
    state: () => request<GameState>('/game/state'),
    setDisplay: (payload: {
      displayMode: GameState['displayMode'];
      activeEventId?: string | null;
    }) => request<GameState>('/game/display', { method: 'POST', body: JSON.stringify(payload) }),
  },

  teams: {
    list: () => request<Team[]>('/teams'),
    create: (payload: CreateTeamPayload) => post('/teams', payload) as Promise<Team>,
    update: (id: string, payload: UpdateTeamPayload) =>
      patch(`/teams/${id}`, payload) as Promise<Team>,
    remove: (id: string) => del(`/teams/${id}`),
  },

  days: {
    list: () => request<Day[]>('/days'),
    create: (label: string, order?: number) =>
      post('/days', { label, order }) as Promise<Day>,
  },

  participants: {
    join: (deviceId: string, name?: string) =>
      post('/participants', { deviceId, name }) as Promise<Participant>,
    get: (deviceId: string) =>
      request<Participant | null>(`/participants/${deviceId}`),
    selectTeam: (deviceId: string, teamId: string) =>
      patch(`/participants/${deviceId}/team`, { teamId }) as Promise<Participant>,
    lobby: () => request<LobbySnapshot>('/participants/lobby'),
    roster: () => request<(Participant & { team: Team | null })[]>('/participants/roster'),
  },

  events: {
    list: (params?: { dayId?: string; status?: EventStatus }) => {
      const q = new URLSearchParams();
      if (params?.dayId) q.set('dayId', params.dayId);
      if (params?.status) q.set('status', params.status);
      const qs = q.toString();
      return request<EventDto[]>(`/events${qs ? `?${qs}` : ''}`);
    },
    active: () => request<EventSnapshot | null>('/events/active'),
    snapshot: (id: string) => request<EventSnapshot>(`/events/${id}`),
    create: (payload: CreateEventPayload) =>
      post('/events', payload) as Promise<EventDto>,
    update: (id: string, payload: Partial<CreateEventPayload>) =>
      patch(`/events/${id}`, payload) as Promise<EventDto>,
    remove: (id: string) => del(`/events/${id}`),

    lobby: (id: string) => post(`/events/${id}/lobby`) as Promise<EventSnapshot>,
    open: (id: string) => post(`/events/${id}/open`) as Promise<EventSnapshot>,
    close: (id: string) => post(`/events/${id}/close`) as Promise<EventSnapshot>,
    reveal: (id: string) => post(`/events/${id}/reveal`) as Promise<EventSnapshot>,
    euroNext: (id: string) => post(`/events/${id}/euro/next`),
    complete: (id: string) => post(`/events/${id}/complete`) as Promise<EventSnapshot>,
    enterResult: (id: string, payload: EnterResultPayload) =>
      post(`/events/${id}/result`, payload) as Promise<EventSnapshot>,
    results: (id: string) => request<VoteResults>(`/events/${id}/results`),
    jury: (id: string) => request<JuryScoreDto[]>(`/events/${id}/jury`),
    addJury: (id: string, teamId: string, points: number) =>
      post(`/events/${id}/jury`, { teamId, points }) as Promise<JuryScoreDto[]>,
  },

  votes: {
    cast: (eventId: string, deviceId: string, targetTeamId: string) =>
      post(`/events/${eventId}/votes`, { deviceId, targetTeamId }) as Promise<VoteProgress>,
    castEuro: (eventId: string, deviceId: string, ranking: string[]) =>
      post(`/events/${eventId}/euro-votes`, { deviceId, ranking }) as Promise<VoteProgress>,
  },

  leaderboard: (filters: LeaderboardFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.scope) q.set('scope', filters.scope);
    if (filters.dayId) q.set('dayId', filters.dayId);
    if (filters.category) q.set('category', filters.category);
    if (filters.mode) q.set('mode', filters.mode);
    const qs = q.toString();
    return request<LeaderboardDto>(`/leaderboard${qs ? `?${qs}` : ''}`);
  },
};
