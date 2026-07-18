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
