const DEVICE_KEY = 'efrendship:deviceId';

/** Stable per-browser participant id (no account). Created on first use. */
export function ensureDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

const votedKey = (eventId: string) => `efrendship:voted:${eventId}`;

export function markVoted(eventId: string): void {
  localStorage.setItem(votedKey(eventId), '1');
}

export function hasVoted(eventId: string): boolean {
  return localStorage.getItem(votedKey(eventId)) === '1';
}

const VOTED_PREFIX = 'efrendship:voted:';

/** All eventIds this device has already voted in (persisted across reloads). */
export function loadVotedEventIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(VOTED_PREFIX) && localStorage.getItem(key) === '1') {
      ids.push(key.slice(VOTED_PREFIX.length));
    }
  }
  return ids;
}
