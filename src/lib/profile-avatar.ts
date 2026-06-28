const storageKey = (userId: string) => `sirrelay:avatar:${userId}`;

export function getStoredAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(storageKey(userId));
}

export function setStoredAvatar(userId: string, dataUrl: string) {
  localStorage.setItem(storageKey(userId), dataUrl);
}

export function clearStoredAvatar(userId: string) {
  localStorage.removeItem(storageKey(userId));
}

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
