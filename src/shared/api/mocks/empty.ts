import { AppError } from '@/shared/api/client';
import type {
  AppliedFilters,
  DashboardFilters,
  DecksListResponse,
  HomeResponse,
  PlayersListResponse,
  TournamentListResponse,
} from '@/shared/api/types';
import { resolveAppliedFilters } from '@/shared/api/mocks/helpers';

function emptyAppliedFilters(filters: Partial<DashboardFilters>): AppliedFilters {
  return resolveAppliedFilters(filters);
}

export function createEmptyHomeResponse(filters: Partial<DashboardFilters>): HomeResponse {
  return {
    appliedFilters: emptyAppliedFilters(filters),
    summary: {
      tournamentsCount: 0,
      tournamentPlayersCount: 0,
      uniquePlayersCount: 0,
      matchesCount: 0,
      uniqueDecksCount: 0,
    },
    recentTournaments: [],
    deckMetagame: [],
    deckPerformance: [],
    topPlayers: [],
    popularMatchups: [],
  };
}

export function createEmptyTournamentListResponse(
  filters: Partial<DashboardFilters> & { page?: number; limit?: number },
): TournamentListResponse {
  return {
    items: [],
    pagination: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
    appliedFilters: emptyAppliedFilters(filters),
  };
}

export function createEmptyPlayersListResponse(filters: Partial<DashboardFilters>): PlayersListResponse {
  return {
    appliedFilters: emptyAppliedFilters(filters),
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
    items: [],
  };
}

export function createEmptyDecksListResponse(filters: Partial<DashboardFilters>): DecksListResponse {
  return {
    items: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
    appliedFilters: emptyAppliedFilters(filters),
  };
}

export function throwEmptyScenarioDetailError(entityName: string): never {
  throw new AppError({
    status: 404,
    code: 'NOT_FOUND_IN_EMPTY_SCENARIO',
    message: `${entityName} недоступен в empty mock-сценарии.`,
  });
}
