import { apiGet, type RequestOptions } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { mapMatchupMatrixResponse, type BackendMatchupMatrixResponse } from '@/shared/api/matchup-mappers';
import type { DashboardFilters } from '@/shared/api/types';

export type MatchupParams = Partial<DashboardFilters> & { formatId: string; top: number };

export async function getMatchups(params: MatchupParams, options?: RequestOptions) {
  const response = await apiGet<BackendMatchupMatrixResponse>(endpoints.matchups, params, options);
  return mapMatchupMatrixResponse(response);
}
