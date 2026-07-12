import { apiGet } from '@/shared/api/client';
import {
  type BackendCity,
  type BackendClub,
  type BackendFormat,
} from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import type { AppliedFilters, CitiesResponse, ClubsResponse, DashboardFilters, FormatsResponse } from '@/shared/api/types';

// Mock adapters are kept in src/shared/api/mocks for possible future local scenarios.
export function getCities() {
  return apiGet<BackendCity[]>(endpoints.cities).then((items) => ({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country || undefined,
    })),
  } satisfies CitiesResponse));
}

export function getClubs(cityId: string) {
  return apiGet<BackendClub[]>(endpoints.clubsByCity(cityId)).then((items) => ({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      cityId: item.cityId ?? cityId,
    })),
  } satisfies ClubsResponse));
}

export function getFormats() {
  return apiGet<BackendFormat[]>(endpoints.formats).then((items) => ({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
    })),
  } satisfies FormatsResponse));
}

export async function resolveAppliedFilters(filters: Partial<DashboardFilters>): Promise<AppliedFilters> {
  const [cities, formats, clubs] = await Promise.all([
    filters.cityId ? getCities() : Promise.resolve({ items: [] }),
    filters.formatId ? getFormats() : Promise.resolve({ items: [] }),
    filters.cityId && filters.clubId ? getClubs(filters.cityId) : Promise.resolve({ items: [] }),
  ]);

  return {
    city: filters.cityId ? cities.items.find((item) => item.id === filters.cityId) ?? { id: filters.cityId, name: filters.cityId } : null,
    club:
      filters.clubId && filters.cityId
        ? clubs.items.find((item) => item.id === filters.clubId) ?? { id: filters.clubId, name: filters.clubId, cityId: filters.cityId }
        : null,
    format: filters.formatId
      ? formats.items.find((item) => item.id === filters.formatId) ?? { id: filters.formatId, name: filters.formatId }
      : null,
    tournamentType: filters.tournamentType || null,
    dateFrom: filters.dateFrom ?? null,
    dateTo: filters.dateTo ?? null,
  };
}
