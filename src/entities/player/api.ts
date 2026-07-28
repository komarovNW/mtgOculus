import { apiGet } from '@/shared/api/client';
import {
  mapAppliedFilters,
  mapPlayerDetailsResponse,
  mapPlayersListResponse,
  type BackendPlayerDetailsResponse,
  type BackendPlayersListResponse,
} from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import { resolveAppliedFilters } from '@/entities/dictionaries/api';
import type { DashboardFilters, PlayersListQuery } from '@/shared/api/types';

export function getPlayers(query: PlayersListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.limit ?? 50;

  return apiGet<BackendPlayersListResponse>(endpoints.players, {
    cityId: query.cityId,
    clubId: query.clubId,
    formatId: query.formatId,
    tournamentType: query.tournamentType,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    search: query.search,
    sort: query.sort,
    order: query.order,
    page,
    page_size: pageSize,
  }).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(query);

    return mapPlayersListResponse(response, appliedFilters, page, pageSize);
  });
}

export async function getAllPlayers(query: PlayersListQuery) {
  const pageSize = 100;
  const firstPage = await getPlayers({
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
      getPlayers({
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

export function getPlayerDetails(id: string, filters: Partial<DashboardFilters>) {
  return apiGet<BackendPlayerDetailsResponse>(endpoints.playerById(id), filters).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(filters);

    return mapPlayerDetailsResponse(response, appliedFilters);
  });
}
