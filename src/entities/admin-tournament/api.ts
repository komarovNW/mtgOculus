import { apiPostForm } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { env } from '@/shared/config/env';
import { createTournamentMock } from '@/shared/api/mocks/admin-tournament.mock';
import type { CreateTournamentPayload, CreateTournamentResponse } from '@/shared/api/types';

function payloadToFormData(payload: CreateTournamentPayload) {
  const formData = new FormData();
  formData.set('date', payload.date);
  formData.set('cityId', payload.cityId);
  formData.set('clubId', payload.clubId);
  formData.set('tournamentType', payload.tournamentType);
  formData.set('formatId', payload.formatId);
  formData.set('aetherhubUrl', payload.aetherhubUrl ?? '');
  formData.set('finalStandingsFile', payload.finalStandingsFile);
  formData.set('allRoundsFile', payload.allRoundsFile);
  formData.set('playerDecksText', payload.playerDecksText);

  return formData;
}

export function createTournament(payload: CreateTournamentPayload) {
  return env.useMocks
    ? createTournamentMock(payload)
    : apiPostForm<CreateTournamentResponse>(endpoints.importTournament, payloadToFormData(payload));
}
