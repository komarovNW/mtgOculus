import { collectPages } from '@/shared/api/collectPages';
import { apiGet, type RequestOptions } from '@/shared/api/client';
import {
  mapAppliedFilters,
  mapDeckDetailsResponse,
  mapDecksListResponse,
  type BackendDeckDetailsResponse,
  type BackendDecksListResponse,
} from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import { resolveAppliedFilters } from '@/entities/dictionaries/api';
import type { DashboardFilters, DecksListQuery } from '@/shared/api/types';

export function getDecks(query: DecksListQuery, options?: RequestOptions) {
  const page = query.page ?? 1;
  const pageSize = query.limit ?? 50;

  return apiGet<BackendDecksListResponse>(endpoints.decks, {
    cityId: query.cityId,
    clubId: query.clubId,
    formatId: query.formatId,
    tournamentType: query.tournamentType,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    search: query.search,
    sort: query.sort,
    page,
    page_size: pageSize,
  }, options).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(query, options);

    return mapDecksListResponse(response, appliedFilters, page, pageSize);
  });
}

export function getAllDecks(query: DecksListQuery, options?: RequestOptions) {
  return collectPages(
    (page) => getDecks({ ...query, page, limit: 100 }, options),
    options,
  );
}

export function getDeckDetails(id: string, filters: Partial<DashboardFilters>, options?: RequestOptions) {
  return apiGet<BackendDeckDetailsResponse>(endpoints.deckById(id), filters, options).then(async (response) => {
    const appliedFilters = response.appliedFilters
      ? mapAppliedFilters(response.appliedFilters)
      : await resolveAppliedFilters(filters, options);

    return mapDeckDetailsResponse(response, appliedFilters);
  });
}
