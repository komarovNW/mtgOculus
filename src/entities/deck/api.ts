import { apiGet } from '@/shared/api/client';
import {
  mapAppliedFilters,
  mapDeckDetailsResponse,
  mapDecksListResponse,
  type BackendDeckDetailsResponse,
  type BackendDecksListResponse,
} from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import { resolveAppliedFilters } from '@/entities/dictionaries/api';
import type { DashboardFilters, DeckDetailsResponse, DecksListQuery, DecksListResponse } from '@/shared/api/types';

export function getDecks(query: DecksListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.limit ?? 50;

  return apiGet<BackendDecksListResponse>(endpoints.decks, {
    cityId: query.cityId,
    clubId: query.clubId,
    formatId: query.formatId,
    tournamentType: query.tournamentType,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    sort: query.sort,
    page,
    page_size: pageSize,
  }).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(query);

    return mapDecksListResponse(response, appliedFilters, page, pageSize);
  });
}

export function getDeckDetails(id: string, filters: Partial<DashboardFilters>) {
  return apiGet<BackendDeckDetailsResponse>(endpoints.deckById(id), filters).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(filters);

    return mapDeckDetailsResponse(response, appliedFilters);
  });
}
