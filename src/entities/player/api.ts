import { apiGet } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { env } from '@/shared/config/env';
import { getPlayerDetailsMock, getPlayersMock } from '@/shared/api/mocks/players.mock';
import type { DashboardFilters, PlayerDetailsResponse, PlayersListQuery, PlayersListResponse } from '@/shared/api/types';

export function getPlayers(query: PlayersListQuery) {
  return env.useMocks ? getPlayersMock(query) : apiGet<PlayersListResponse>(endpoints.players, query);
}

export function getPlayerDetails(id: string, filters: Partial<DashboardFilters>) {
  return env.useMocks
    ? getPlayerDetailsMock(id, filters)
    : apiGet<PlayerDetailsResponse>(endpoints.playerById(id), filters);
}

