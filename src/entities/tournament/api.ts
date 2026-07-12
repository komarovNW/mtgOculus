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
import type { DashboardFilters, HomeResponse, TournamentDetailsResponse, TournamentListQuery, TournamentListResponse } from '@/shared/api/types';

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

export function getTournamentDetails(id: string) {
  return apiGet<BackendTournamentDetailsResponse>(endpoints.tournamentById(id)).then(mapTournamentDetailsResponse);
}
