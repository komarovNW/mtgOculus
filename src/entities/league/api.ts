import { apiGet, type RequestOptions } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import type {
  AppliedFilters,
  LeagueDetails,
  LeagueListItem,
  LeagueListResponse,
  LeagueSortField,
} from '@/shared/api/types';

type BackendLeagueListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Omit<LeagueListItem, 'id'> & { id: string | number }>;
  appliedFilters?: AppliedFilters;
};

type BackendLeagueDetails = Omit<LeagueDetails, 'id' | 'club' | 'tournaments' | 'standings'> & {
  id: string | number;
  club: { id: string; name: string; cityId?: string };
  tournaments: Array<Omit<LeagueDetails['tournaments'][number], 'id'> & { id: string | number }>;
  standings: Array<Omit<LeagueDetails['standings'][number], 'player' | 'participations'> & {
    player: { id: string | number; name: string };
    participations: Array<Omit<LeagueDetails['standings'][number]['participations'][number], 'tournamentId'> & {
      tournamentId: string | number;
    }>;
  }>;
};

export type LeagueListParams = {
  cityId?: string;
  clubId?: string;
  formatId?: string;
  page?: number;
  pageSize?: number;
};

function normalizeLeague(item: BackendLeagueListResponse['results'][number]): LeagueListItem {
  return {
    ...item,
    id: String(item.id),
    bestTournamentsCount: item.bestTournamentsCount ?? null,
  };
}

export function getLeagues(params: LeagueListParams, options?: RequestOptions) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 100;

  return apiGet<BackendLeagueListResponse>(endpoints.leagues, {
    cityId: params.cityId,
    clubId: params.clubId,
    formatId: params.formatId,
    page,
    page_size: pageSize,
  }, options).then<LeagueListResponse>((response) => ({
    items: response.results.map(normalizeLeague),
    pagination: {
      page,
      limit: pageSize,
      total: response.count,
      hasMore: Boolean(response.next),
    },
    appliedFilters: response.appliedFilters ?? {},
  }));
}

export function getLeagueDetails(id: string, sort: LeagueSortField[], options?: RequestOptions) {
  return apiGet<BackendLeagueDetails>(endpoints.leagueById(id), {
    sort: sort.length ? sort.join(',') : undefined,
  }, options).then<LeagueDetails>((response) => ({
    ...response,
    id: String(response.id),
    club: { ...response.club, cityId: response.club.cityId ?? '' },
    bestTournamentsCount: response.bestTournamentsCount ?? null,
    tournaments: response.tournaments.map((tournament) => ({
      ...tournament,
      id: String(tournament.id),
    })),
    standings: response.standings.map((standing) => ({
      ...standing,
      player: { ...standing.player, id: String(standing.player.id) },
      participations: standing.participations.map((participation) => ({
        ...participation,
        tournamentId: String(participation.tournamentId),
      })),
    })),
  }));
}
