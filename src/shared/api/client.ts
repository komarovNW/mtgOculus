import { env } from '@/shared/config/env';
import type { ApiErrorDetail, QueryValue } from '@/shared/api/types';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];
  public readonly warnings?: ApiErrorDetail[];

  constructor({
    message,
    status = 500,
    code = 'UNKNOWN_ERROR',
    details,
    warnings,
  }: {
    message: string;
    status?: number;
    code?: string;
    details?: ApiErrorDetail[];
    warnings?: ApiErrorDetail[];
  }) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.warnings = warnings;
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
      detail?: string;
      success?: boolean;
      errors?: Array<{
        code?: string;
        message: string;
        source?: string;
      }>;
      warnings?: Array<{
        code?: string;
        message: string;
        source?: string;
      }>;
      [key: string]: unknown;
    };

    if (data.error?.message) {
      return new AppError({
        status: response.status,
        code: data.error.code ?? 'REQUEST_FAILED',
        message: data.error.message,
        details: data.error.details,
      });
    }

    if (data.success === false && Array.isArray(data.errors) && data.errors.length > 0) {
      return new AppError({
        status: response.status,
        code: data.errors[0]?.code ?? 'REQUEST_FAILED',
        message: data.errors.map((item) => item.message).join(' '),
        details: data.errors.map((item) => ({
          field: item.code,
          message: item.message,
          source: item.source,
        })),
        warnings: Array.isArray(data.warnings)
          ? data.warnings.map((item) => ({
              field: item.code,
              message: item.message,
              source: item.source,
            }))
          : undefined,
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
      ([key, value]) =>
        key !== 'success' &&
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string'),
    ) as Array<[string, string[]]>;

    if (fieldEntries.length > 0) {
      const details = fieldEntries.flatMap(([field, messages]) =>
        messages.map((message) => ({
          field,
          message,
          source: 'body',
        })),
      );

      return new AppError({
        status: response.status,
        code: 'REQUEST_FAILED',
        message: details.map((item) => item.message).join(' '),
        details,
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
    // Auth is temporarily disabled for all API requests.
    headers: undefined,
    method: 'GET',
    signal: options?.signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

export async function apiPostForm<T>(path: string, body: FormData, options?: RequestOptions): Promise<T> {
  const response = await fetch(buildUrl(path), {
    // Auth is temporarily disabled for all API requests.
    headers: undefined,
    method: 'POST',
    body,
    signal: options?.signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
