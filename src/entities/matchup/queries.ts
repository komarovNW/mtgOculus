import { queryOptions } from '@tanstack/react-query';
import { getMatchups, type MatchupParams } from '@/entities/matchup/api';

export function matchupsQueryOptions(params: MatchupParams) {
  return queryOptions({
    queryKey: ['matchups', params],
    queryFn: ({ signal }) => getMatchups(params, { signal }),
    enabled: Boolean(params.formatId),
    staleTime: 30_000,
  });
}
