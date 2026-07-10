import type { CitiesResponse, ClubsResponse, FormatsResponse } from '@/shared/api/types';
import { cities, formats } from '@/shared/api/mocks/fixtures';
import { getClubOptionsByCity, wait } from '@/shared/api/mocks/helpers';

export async function getCitiesMock(): Promise<CitiesResponse> {
  return wait({ items: cities });
}

export async function getClubsMock(cityId: string): Promise<ClubsResponse> {
  return wait({ items: getClubOptionsByCity(cityId) });
}

export async function getFormatsMock(): Promise<FormatsResponse> {
  return wait({ items: formats });
}

