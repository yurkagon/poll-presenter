const DEVICE_KEY = 'talkshow:deviceId';

/** Stable per-browser anonymous id (no account). Created on first use. */
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
