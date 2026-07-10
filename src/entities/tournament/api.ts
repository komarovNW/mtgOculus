import { apiGet } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { env } from '@/shared/config/env';
import { getHomeMock } from '@/shared/api/mocks/home.mock';
import { getTournamentDetailsMock, getTournamentsMock } from '@/shared/api/mocks/tournaments.mock';
import type { DashboardFilters, HomeResponse, TournamentDetailsResponse, TournamentListQuery, TournamentListResponse } from '@/shared/api/types';

export function getHomeData(filters: Partial<DashboardFilters>) {
  return env.useMocks ? getHomeMock(filters) : apiGet<HomeResponse>(endpoints.home, filters);
}

export function getTournaments(query: TournamentListQuery) {
  return env.useMocks
    ? getTournamentsMock(query)
    : apiGet<TournamentListResponse>(endpoints.tournaments, query);
}

export function getTournamentDetails(id: string) {
  return env.useMocks
    ? getTournamentDetailsMock(id)
    : apiGet<TournamentDetailsResponse>(endpoints.tournamentById(id));
}

