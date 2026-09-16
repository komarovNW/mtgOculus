import { useQuery } from '@tanstack/react-query';
import { dictionaryQueries } from '@/entities/dictionaries/queries';
import type { AppliedFilters, DashboardFilters } from '@/shared/api/types';

/** Labels for a local search that does not need its own statistics request. */
export function useAppliedFilters(filters: Partial<DashboardFilters>, applied?: AppliedFilters): AppliedFilters {
  const cities = useQuery({ ...dictionaryQueries.cities(), enabled: !applied && Boolean(filters.cityId) });
  const formats = useQuery({ ...dictionaryQueries.formats(), enabled: !applied && Boolean(filters.formatId) });
  const clubs = useQuery({ ...dictionaryQueries.clubs(filters.cityId ?? ''), enabled: !applied && Boolean(filters.cityId && filters.clubId) });

  return applied ?? {
    city: cities.data?.items.find((item) => item.id === filters.cityId),
    club: clubs.data?.items.find((item) => item.id === filters.clubId),
    format: formats.data?.items.find((item) => item.id === filters.formatId),
    tournamentType: filters.tournamentType || null,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  };
}
