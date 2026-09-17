import { queryOptions } from '@tanstack/react-query';
import {
  getLeagueDetails,
  getLeagueOptions,
  getLeagues,
  type LeagueListParams,
  type LeagueOptionsParams,
} from '@/entities/league/api';

export const leagueQueries = {
  list: (params: LeagueListParams) => queryOptions({
    queryKey: ['leagues', params],
    queryFn: ({ signal }) => getLeagues(params, { signal }),
    staleTime: 30_000,
  }),
  options: (params: LeagueOptionsParams) => queryOptions({
    queryKey: ['leagues', 'options', params],
    queryFn: ({ signal }) => getLeagueOptions(params, { signal }),
    staleTime: 30_000,
  }),
  details: (id: string) => queryOptions({
    queryKey: ['leagues', id],
    queryFn: ({ signal }) => getLeagueDetails(id, [], { signal }),
    enabled: Boolean(id),
    staleTime: 30_000,
  }),
};
