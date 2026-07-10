import { env } from '@/shared/config/env';
import type { ApiErrorDetail, QueryValue } from '@/shared/api/types';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor({
    message,
    status = 500,
    code = 'UNKNOWN_ERROR',
    details,
  }: {
    message: string;
    status?: number;
    code?: string;
    details?: ApiErrorDetail[];
  }) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
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
        details?: ApiErrorDetail[];
      };
    };

    return new AppError({
      status: response.status,
      code: data.error?.code ?? 'REQUEST_FAILED',
      message: data.error?.message ?? 'Не удалось выполнить запрос.',
      details: data.error?.details,
    });
  } catch {
    return new AppError({
      status: response.status,
      code: 'REQUEST_FAILED',
      message: 'Не удалось выполнить запрос.',
    });
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

export async function apiPostForm<T>(path: string, body: FormData, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    body,
    signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

