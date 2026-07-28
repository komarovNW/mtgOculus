import { apiGet } from '@/shared/api/client';
import {
  mapAppliedFilters,
  mapHomeResponse,
  mapTournamentDetailsResponse,
  mapTournamentListResponse,
  type BackendHomeResponse,
  type BackendPaginated,
  type BackendTournamentDetailsResponse,
  type BackendTournamentListItem,
} from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import { resolveAppliedFilters } from '@/entities/dictionaries/api';
import type { DashboardFilters, TournamentListQuery } from '@/shared/api/types';

export function getHomeData(filters: Partial<DashboardFilters>) {
  return apiGet<BackendHomeResponse>(endpoints.home, filters).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(filters);

    return mapHomeResponse(response, appliedFilters);
  });
}

export function getTournaments(query: TournamentListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.limit ?? 50;

  return apiGet<BackendPaginated<BackendTournamentListItem>>(endpoints.tournaments, {
    cityId: query.cityId,
    clubId: query.clubId,
    formatId: query.formatId,
    tournamentType: query.tournamentType,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    page,
    page_size: pageSize,
  }).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(query);

    return mapTournamentListResponse(response, appliedFilters, page, pageSize);
  });
}

export async function getAllTournaments(query: TournamentListQuery) {
  const pageSize = 100;
  const firstPage = await getTournaments({
    ...query,
    page: 1,
    limit: pageSize,
  });
  const totalPages = firstPage.pagination.totalPages ?? 1;

  if (totalPages <= 1) {
    return firstPage.items;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getTournaments({
        ...query,
        page: index + 2,
        limit: pageSize,
      }),
    ),
  );

  return [
    ...firstPage.items,
    ...remainingPages.flatMap((page) => page.items),
  ];
}

export function getTournamentDetails(id: string) {
  return apiGet<BackendTournamentDetailsResponse>(endpoints.tournamentById(id)).then(mapTournamentDetailsResponse);
}
