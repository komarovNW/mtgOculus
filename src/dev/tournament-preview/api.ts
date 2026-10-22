import type { QueryValue } from '@/shared/api/types';
import { tournamentPreviews } from './fixtures';

// Only loaded in development when VITE_MOCK_TOURNAMENTS=true.
export function getTournamentMockResponse(path: string, params: Record<string, QueryValue> = {}): unknown {
  const headers = tournamentPreviews.map((item) => item.raw.tournament);
  const first = headers[0];
  if (path === '/cities') return [first.city];
  if (path === `/cities/${first.city!.id}/clubs`) return [first.club];
  if (path === '/formats') return [
    first.format,
    { id: 'standard', name: 'Standard' },
  ];
  const detail = tournamentPreviews.find((item) => path === `/tournaments/${item.raw.tournament.id}`);
  if (detail) return detail.raw;
  if (path !== '/tournaments' || params.tournamentType !== 'tournament') return undefined;

  const filtered = headers.filter((item) =>
    (!params.cityId || item.city?.id === params.cityId) &&
    (!params.clubId || item.club?.id === params.clubId) &&
    (!params.formatId || item.format?.id === params.formatId) &&
    (!params.dateFrom || item.date >= String(params.dateFrom)) &&
    (!params.dateTo || item.date <= String(params.dateTo)),
  ).sort((a, b) => b.date.localeCompare(a.date));
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.page_size ?? 50);
  return {
    count: filtered.length,
    results: filtered.slice((page - 1) * pageSize, page * pageSize),
    next: page * pageSize < filtered.length ? `/tournaments?page=${page + 1}` : null,
    previous: page > 1 ? `/tournaments?page=${page - 1}` : null,
    appliedFilters: {
      city: params.cityId ? first.city : null,
      club: params.clubId ? first.club : null,
      format: params.formatId ? first.format : null,
      tournamentType: 'tournament', dateFrom: params.dateFrom ?? null, dateTo: params.dateTo ?? null,
    },
  };
}
