import { AppError } from '@/shared/api/client';
import { env } from '@/shared/config/env';
import type { AuthSession, SignInPayload } from '@/shared/auth/model';

export async function signInWithPassword({ login, password }: SignInPayload): Promise<AuthSession> {
  const normalizedLogin = login.trim();

  if (!normalizedLogin || !password) {
    throw new AppError({
      status: 400,
      code: 'AUTH_VALIDATION_ERROR',
      message: 'Введите логин и пароль.',
    });
  }

  if (normalizedLogin !== env.adminLogin || password !== env.adminPassword) {
    throw new AppError({
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Неверный логин или пароль.',
    });
  }

  return {
    token: `local-admin:${normalizedLogin}`,
    signedAt: new Date().toISOString(),
    user: {
      id: 'admin',
      login: env.adminLogin,
      name: env.adminDisplayName,
      role: 'admin',
      permissions: ['tournament:create'],
    },
  };
}
