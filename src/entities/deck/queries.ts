import { queryOptions } from '@tanstack/react-query';
import { getAllDecks } from '@/entities/deck/api';
import type { DashboardFilters } from '@/shared/api/types';

// Shared by the list insights/search and the detail metagame denominator.
export function allDecksQueryOptions(filters: Partial<DashboardFilters>) {
  return queryOptions({
    queryKey: ['decks', 'all', filters],
    queryFn: ({ signal }) => getAllDecks({ ...filters, sort: 'playersCount_desc' }, { signal }),
  });
}
