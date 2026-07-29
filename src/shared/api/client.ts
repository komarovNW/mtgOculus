import { env } from '@/shared/config/env';
import type { ImportFeedbackItem, QueryValue } from '@/shared/api/types';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: ImportFeedbackItem[];
  public readonly warnings: ImportFeedbackItem[];

  constructor({
    message,
    status = 500,
    code = 'UNKNOWN_ERROR',
    details = [],
    warnings = [],
  }: {
    message: string;
    status?: number;
    code?: string;
    details?: ImportFeedbackItem[];
    warnings?: ImportFeedbackItem[];
  }) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.warnings = warnings;
  }
}

function parseFeedbackItems(value: unknown): ImportFeedbackItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap<ImportFeedbackItem>((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      !('message' in item) ||
      typeof item.message !== 'string' ||
      !item.message.trim()
    ) {
      return [];
    }

    const raw = item as Record<string, unknown>;

    return [{
      code: typeof raw.code === 'string' ? raw.code : 'REQUEST_FAILED',
      message: item.message.trim(),
      source: typeof raw.source === 'string' ? raw.source : undefined,
      playerName: typeof raw.playerName === 'string' ? raw.playerName : undefined,
      roundNumber: typeof raw.roundNumber === 'number' ? raw.roundNumber : undefined,
      tableNumber: typeof raw.tableNumber === 'number' ? raw.tableNumber : undefined,
      rawValue: typeof raw.rawValue === 'string' ? raw.rawValue : undefined,
      matchedValue: typeof raw.matchedValue === 'string' ? raw.matchedValue : undefined,
    }];
  });
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
      errors?: unknown;
      warnings?: unknown;
      detail?: string;
      [key: string]: unknown;
    };
    const details = parseFeedbackItems(data.errors);
    const warnings = parseFeedbackItems(data.warnings);

    if (details.length > 0) {
      return new AppError({
        status: response.status,
        code: details[0].code,
        message: details[0].message,
        details,
        warnings,
      });
    }

    if (data.error?.message) {
      return new AppError({
        status: response.status,
        code: data.error.code ?? 'REQUEST_FAILED',
        message: data.error.message,
        warnings,
      });
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
      return new AppError({
        status: response.status,
        code: 'REQUEST_FAILED',
        message: data.detail,
        warnings,
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
        warnings,
      });
    }

    return new AppError({
      status: response.status,
      code: 'REQUEST_FAILED',
      message: 'Не удалось загрузить данные.',
      warnings,
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

export async function apiPostForm<T>(
  path: string,
  body: FormData,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    body,
    signal: options?.signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
