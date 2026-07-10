import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DashboardFilters } from '@/shared/api/types';

const FILTER_KEYS = ['cityId', 'clubId', 'formatId', 'tournamentType', 'dateFrom', 'dateTo'] as const;

export const defaultFilters: DashboardFilters = {
  cityId: 'moscow',
  clubId: '',
  formatId: 'legacy',
  tournamentType: '',
  dateFrom: '',
  dateTo: '',
};

export function readDashboardFilters(searchParams: URLSearchParams): DashboardFilters {
  return {
    cityId: searchParams.get('cityId') || defaultFilters.cityId,
    clubId: searchParams.get('clubId') || '',
    formatId: searchParams.get('formatId') || defaultFilters.formatId,
    tournamentType: (searchParams.get('tournamentType') || '') as DashboardFilters['tournamentType'],
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  };
}

export function toApiFilters(filters: DashboardFilters) {
  return {
    cityId: filters.cityId || undefined,
    clubId: filters.clubId || undefined,
    formatId: filters.formatId || undefined,
    tournamentType: filters.tournamentType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}

export function useDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readDashboardFilters(searchParams), [searchParams]);

  function updateQueryParams(values: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);

    Object.entries(values).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    setSearchParams(next);
  }

  function setFilters(values: Partial<DashboardFilters>) {
    const nextFilters = { ...filters, ...values };

    if (values.cityId && values.cityId !== filters.cityId) {
      nextFilters.clubId = '';
    }

    const next = new URLSearchParams(searchParams);

    FILTER_KEYS.forEach((key) => {
      const value = nextFilters[key];

      if (!value) {
        next.delete(key);
      } else if (value !== defaultFilters[key]) {
        next.set(key, value);
      } else if (key === 'cityId' || key === 'formatId') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });

    setSearchParams(next);
  }

  function resetFilters() {
    const next = new URLSearchParams(searchParams);

    FILTER_KEYS.forEach((key) => {
      if (defaultFilters[key]) {
        next.set(key, defaultFilters[key]);
      } else {
        next.delete(key);
      }
    });

    setSearchParams(next);
  }

  return {
    filters,
    apiFilters: toApiFilters(filters),
    searchParams,
    setFilters,
    updateQueryParams,
    resetFilters,
  };
}

