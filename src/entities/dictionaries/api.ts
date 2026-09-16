import { apiGet, type RequestOptions } from '@/shared/api/client';
import {
  type BackendCity,
  type BackendClub,
  type BackendFormat,
} from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import type { AppliedFilters, CitiesResponse, ClubsResponse, DashboardFilters, FormatsResponse } from '@/shared/api/types';

export function getCities(options?: RequestOptions) {
  return apiGet<BackendCity[]>(endpoints.cities, undefined, options).then((items) => ({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country || undefined,
    })),
  } satisfies CitiesResponse));
}

export function getClubs(cityId: string, options?: RequestOptions) {
  return apiGet<BackendClub[]>(endpoints.clubsByCity(cityId), undefined, options).then((items) => ({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      cityId: item.cityId ?? cityId,
    })),
  } satisfies ClubsResponse));
}

export function getFormats(options?: RequestOptions) {
  return apiGet<BackendFormat[]>(endpoints.formats, undefined, options).then((items) => ({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
    })),
  } satisfies FormatsResponse));
}

export async function resolveAppliedFilters(filters: Partial<DashboardFilters>, options?: RequestOptions): Promise<AppliedFilters> {
  const [cities, formats, clubs] = await Promise.all([
    filters.cityId ? getCities(options) : Promise.resolve({ items: [] }),
    filters.formatId ? getFormats(options) : Promise.resolve({ items: [] }),
    filters.cityId && filters.clubId ? getClubs(filters.cityId, options) : Promise.resolve({ items: [] }),
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
