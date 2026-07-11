import { useState, type PropsWithChildren } from 'react';
import { AuthContext } from '@/app/providers/auth-context';
import { signInWithPassword } from '@/shared/auth/service';
import { readStoredAuthSession, writeStoredAuthSession } from '@/shared/auth/storage';
import type { AuthPermission, AuthSession, SignInPayload } from '@/shared/auth/model';

type AuthProviderProps = PropsWithChildren<{
  initialSession?: AuthSession | null;
}>;

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    initialSession === undefined ? readStoredAuthSession() : initialSession,
  );

  async function signIn(payload: SignInPayload) {
    const nextSession = await signInWithPassword(payload);
    writeStoredAuthSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }

  function signOut() {
    writeStoredAuthSession(null);
    setSession(null);
  }

  function hasPermission(permission: AuthPermission) {
    return Boolean(session?.user.permissions.includes(permission));
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session),
        signIn,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
