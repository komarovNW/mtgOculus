import { apiGet } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { env } from '@/shared/config/env';
import { getDeckDetailsMock, getDecksMock } from '@/shared/api/mocks/decks.mock';
import type { DashboardFilters, DeckDetailsResponse, DecksListQuery, DecksListResponse } from '@/shared/api/types';

export function getDecks(query: DecksListQuery) {
  return env.useMocks ? getDecksMock(query) : apiGet<DecksListResponse>(endpoints.decks, query);
}

export function getDeckDetails(id: string, filters: Partial<DashboardFilters>) {
  return env.useMocks
    ? getDeckDetailsMock(id, filters)
    : apiGet<DeckDetailsResponse>(endpoints.deckById(id), filters);
}

