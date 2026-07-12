import { AppError } from '@/shared/api/client';
import type { AuthSession, SignInPayload } from '@/shared/auth/model';

function encodeBasicCredentials(login: string, password: string) {
  const value = `${login}:${password}`;
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

export async function signInWithPassword({ login, password }: SignInPayload): Promise<AuthSession> {
  const normalizedLogin = login.trim();
  const normalizedPassword = password.trim();

  if (!normalizedLogin || !normalizedPassword) {
    throw new AppError({
      status: 400,
      code: 'AUTH_VALIDATION_ERROR',
      message: 'Введите логин и пароль.',
    });
  }

  if (normalizedLogin !== 'admin' || normalizedPassword !== 'admin') {
    throw new AppError({
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Неверный логин или пароль.',
    });
  }

  return {
    token: encodeBasicCredentials(normalizedLogin, normalizedPassword),
    signedAt: new Date().toISOString(),
    user: {
      id: 'admin',
      login: normalizedLogin,
      name: 'Администратор',
      role: 'admin',
      permissions: ['tournament:create'],
    },
  };
}
