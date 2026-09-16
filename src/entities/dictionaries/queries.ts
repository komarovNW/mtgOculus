import { queryOptions } from '@tanstack/react-query';
import { getCities, getClubs, getFormats } from '@/entities/dictionaries/api';

const staleTime = 10 * 60_000;

export const dictionaryQueries = {
  cities: () => queryOptions({
    queryKey: ['dictionaries', 'cities'],
    queryFn: ({ signal }) => getCities({ signal }),
    staleTime,
  }),
  formats: () => queryOptions({
    queryKey: ['dictionaries', 'formats'],
    queryFn: ({ signal }) => getFormats({ signal }),
    staleTime,
  }),
  clubs: (cityId: string) => queryOptions({
    queryKey: ['dictionaries', 'clubs', cityId],
    queryFn: ({ signal }) => getClubs(cityId, { signal }),
    staleTime,
    enabled: Boolean(cityId),
  }),
};
