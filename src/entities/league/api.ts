import { apiGet, type RequestOptions } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import type {
  AppliedFilters,
  LeagueDetails,
  LeagueListItem,
  LeagueListResponse,
  LeagueOption,
  LeagueQualifierOption,
  LeagueSortField,
} from '@/shared/api/types';

type BackendLeagueListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Omit<LeagueListItem, 'id'> & { id: string | number }>;
  appliedFilters?: AppliedFilters;
};

type BackendLeagueQualification = Omit<LeagueDetails['qualification'][number], 'seats'> & {
  seats?: Array<Omit<LeagueDetails['qualification'][number]['seats'][number], 'player'> & {
    player: { id: string | number; name: string } | null;
  }> | null;
  players?: Array<{
    player: { id: string | number; name: string };
    place: number;
  }> | null;
};

type BackendLeagueDetails = Omit<LeagueDetails, 'id' | 'club' | 'columns' | 'qualification' | 'rules' | 'tournaments' | 'standings'> & {
  id: string | number;
  club: { id: string; name: string; cityId?: string };
  columns?: LeagueDetails['columns'] | null;
  qualification?: BackendLeagueQualification[] | null;
  rules?: LeagueDetails['rules'] | null;
  tournaments?: Array<Omit<LeagueDetails['tournaments'][number], 'id'> & { id: string | number }> | null;
  standings?: Array<Omit<LeagueDetails['standings'][number], 'player' | 'participations'> & {
    player: { id: string | number; name: string };
    participations?: Array<Omit<LeagueDetails['standings'][number]['participations'][number], 'tournamentId'> & {
      tournamentId: string | number;
    }> | null;
  }> | null;
};

export type LeagueListParams = {
  cityId?: string;
  clubId?: string;
  formatId?: string;
  page?: number;
  pageSize?: number;
};

export type LeagueOptionsParams = {
  cityId?: string;
  clubId?: string;
  formatId?: string;
  date?: string;
};

type BackendLeagueOption = Omit<LeagueOption, 'id'> & {
  id: string | number;
};

type BackendLeagueQualifierOption = Omit<LeagueQualifierOption, 'id' | 'league'> & {
  id: string | number;
  league: { id: string | number; name: string };
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

export function getLeagueOptions(params: LeagueOptionsParams, options?: RequestOptions) {
  return apiGet<BackendLeagueOption[]>(endpoints.leagueOptions, {
    cityId: params.cityId,
    clubId: params.clubId,
    formatId: params.formatId,
    date: params.date,
  }, options).then<LeagueOption[]>((items) => items.map((item) => ({
    ...item,
    id: String(item.id),
    club: { ...item.club, cityId: item.club.cityId ?? params.cityId ?? '' },
  })));
}

export function getLeagueQualifierOptions(leagueId: string, options?: RequestOptions) {
  return apiGet<BackendLeagueQualifierOption[]>(endpoints.leagueQualifierOptions, {
    leagueId,
  }, options).then<LeagueQualifierOption[]>((items) => items.map((item) => ({
    ...item,
    id: String(item.id),
    league: { ...item.league, id: String(item.league.id) },
  })));
}

export function getLeagueDetails(id: string, sort: LeagueSortField[] = [], options?: RequestOptions) {
  return apiGet<BackendLeagueDetails>(endpoints.leagueById(id), {
    sort: sort.length ? sort.join(',') : undefined,
  }, options).then<LeagueDetails>((response) => ({
    ...response,
    id: String(response.id),
    club: { ...response.club, cityId: response.club.cityId ?? '' },
    bestTournamentsCount: response.bestTournamentsCount ?? null,
    columns: [...(response.columns ?? [])].sort((left, right) => left.position - right.position),
    rules: response.rules ?? [],
    qualification: (response.qualification ?? []).map((block) => {
      const receivedSeats = block.seats ?? block.players
        ?.slice()
        .sort((left, right) => left.place - right.place)
        .map((entry) => ({ player: entry.player, comment: null })) ?? [];
      const emptySeats = Array.from(
        { length: Math.max(0, block.slots - receivedSeats.length) },
        () => ({ player: null, comment: null }),
      );

      return {
        ...block,
        seats: receivedSeats.concat(emptySeats).map((seat) => ({
          ...seat,
          player: seat.player
            ? { ...seat.player, id: String(seat.player.id) }
            : null,
        })),
      };
    }),
    tournaments: (response.tournaments ?? []).map((tournament) => ({
      ...tournament,
      id: String(tournament.id),
    })),
    standings: (response.standings ?? []).map((standing) => ({
      ...standing,
      player: { ...standing.player, id: String(standing.player.id) },
      breakdown: standing.breakdown ?? [],
      participations: (standing.participations ?? []).map((participation) => ({
        ...participation,
        tournamentId: String(participation.tournamentId),
      })),
    })),
  }));
}
