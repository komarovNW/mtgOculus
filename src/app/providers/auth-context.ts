import { createContext } from 'react';
import type { AuthPermission, AuthSession, AuthUser, SignInPayload } from '@/shared/auth/model';

export type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (payload: SignInPayload) => Promise<AuthSession>;
  signOut: () => void;
  hasPermission: (permission: AuthPermission) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
