import { collectPages } from '@/shared/api/collectPages';
import { apiGet, type RequestOptions } from '@/shared/api/client';
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

export function getPlayers(query: PlayersListQuery, options?: RequestOptions) {
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
  }, options).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(query, options);

    return mapPlayersListResponse(response, appliedFilters, page, pageSize);
  });
}

export function getAllPlayers(query: PlayersListQuery, options?: RequestOptions) {
  return collectPages(
    (page) => getPlayers({ ...query, page, limit: 100 }, options),
    options,
  );
}

export function getPlayerDetails(id: string, filters: Partial<DashboardFilters>, options?: RequestOptions) {
  return apiGet<BackendPlayerDetailsResponse>(endpoints.playerById(id), filters, options).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(filters, options);

    return mapPlayerDetailsResponse(response, appliedFilters);
  });
}
