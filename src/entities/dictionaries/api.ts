import { apiGet } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { env } from '@/shared/config/env';
import { getCitiesMock, getClubsMock, getFormatsMock } from '@/shared/api/mocks/dictionaries.mock';
import type { CitiesResponse, ClubsResponse, FormatsResponse } from '@/shared/api/types';

export function getCities() {
  return env.useMocks ? getCitiesMock() : apiGet<CitiesResponse>(endpoints.cities);
}

export function getClubs(cityId: string) {
  return env.useMocks
    ? getClubsMock(cityId)
    : apiGet<ClubsResponse>(endpoints.clubsByCity(cityId));
}

export function getFormats() {
  return env.useMocks ? getFormatsMock() : apiGet<FormatsResponse>(endpoints.formats);
}

