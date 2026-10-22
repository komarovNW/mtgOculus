import { Link, useLocation } from 'react-router-dom';
import { getDashboardFilterSearch } from '@/shared/lib/filters';
import type { TournamentType } from '@/shared/api/types';

export function EventCountLink({ count, type, scope }: {
  count: number; type: TournamentType; scope: Record<string, string>;
}) {
  const location = useLocation();
  const params = new URLSearchParams(getDashboardFilterSearch(location.search));
  // A geography summary chooses its own scope, retaining the time range.
  for (const key of ['cityId', 'clubId', 'formatId']) params.set(key, scope[key] ?? '');
  params.set('tournamentType', type);
  return <Link className="entity-link" aria-label={`${type === 'daily' ? 'Дейлики' : 'Турниры'}: ${count}`}
    to={{ pathname: type === 'daily' ? '/dailies' : '/tournaments', search: params.toString() }}>{count}</Link>;
}
