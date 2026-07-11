import type { AuthSession } from '@/shared/auth/model';

const AUTH_STORAGE_KEY = 'magic-oculus-auth-session';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function readStoredAuthSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as Partial<AuthSession>;

    if (!session.token || !session.user?.id || !session.user.permissions) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAuthSession(session: AuthSession | null) {
  if (!isBrowser()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredAuthToken() {
  return readStoredAuthSession()?.token ?? null;
}
