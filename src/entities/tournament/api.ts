import { collectPages } from '@/shared/api/collectPages';
import { apiGet, type RequestOptions } from '@/shared/api/client';
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

export function getHomeData(filters: Partial<DashboardFilters>, options?: RequestOptions) {
  return apiGet<BackendHomeResponse>(endpoints.home, filters, options).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(filters, options);

    return mapHomeResponse(response, appliedFilters);
  });
}

export function getTournaments(query: TournamentListQuery, options?: RequestOptions) {
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
  }, options).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(query, options);

    return mapTournamentListResponse(response, appliedFilters, page, pageSize);
  });
}

export function getAllTournaments(query: TournamentListQuery, options?: RequestOptions) {
  return collectPages(
    (page) => getTournaments({ ...query, page, limit: 100 }, options),
    options,
  );
}

export function getTournamentDetails(id: string, options?: RequestOptions) {
  return apiGet<BackendTournamentDetailsResponse>(endpoints.tournamentById(id), undefined, options).then(mapTournamentDetailsResponse);
}
