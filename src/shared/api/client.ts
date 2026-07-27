import { env } from '@/shared/config/env';
import type { QueryValue } from '@/shared/api/types';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor({
    message,
    status = 500,
    code = 'UNKNOWN_ERROR',
  }: {
    message: string;
    status?: number;
    code?: string;
  }) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path: string, params?: Record<string, QueryValue>) {
  const normalizedBase = env.apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseError(response: Response): Promise<AppError> {
  try {
    const data = (await response.json()) as {
      error?: {
        code?: string;
        message?: string;
      };
      detail?: string;
      [key: string]: unknown;
    };

    if (data.error?.message) {
      return new AppError({
        status: response.status,
        code: data.error.code ?? 'REQUEST_FAILED',
        message: data.error.message,
      });
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
      return new AppError({
        status: response.status,
        code: 'REQUEST_FAILED',
        message: data.detail,
      });
    }

    const fieldEntries = Object.entries(data).filter(
      ([, value]) =>
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string'),
    ) as Array<[string, string[]]>;

    if (fieldEntries.length > 0) {
      const messages = fieldEntries.flatMap(([, fieldMessages]) => fieldMessages);

      return new AppError({
        status: response.status,
        code: 'REQUEST_FAILED',
        message: messages.join(' '),
      });
    }

    return new AppError({
      status: response.status,
      code: 'REQUEST_FAILED',
      message: 'Не удалось загрузить данные.',
    });
  } catch {
    return new AppError({
      status: response.status,
      code: 'REQUEST_FAILED',
      message: 'Не удалось загрузить данные.',
    });
  }
}

type RequestOptions = {
  signal?: AbortSignal;
};

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    signal: options?.signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
