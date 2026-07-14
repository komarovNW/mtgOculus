import { apiPostForm } from '@/shared/api/client';
import { mapCreateTournamentResponse, type BackendCreateTournamentSuccess } from '@/shared/api/backend-mappers';
import { endpoints } from '@/shared/api/endpoints';
import type { CreateTournamentPayload } from '@/shared/api/types';

function payloadToFormData(payload: CreateTournamentPayload) {
  const formData = new FormData();
  formData.set('date', payload.date);
  formData.set('cityId', payload.cityId);
  formData.set('clubId', payload.clubId);
  formData.set('tournamentType', payload.tournamentType);
  formData.set('formatId', payload.formatId);
  formData.set('aetherhubUrl', payload.aetherhubUrl);
  formData.set('playerDecksText', payload.playerDecksText);

  return formData;
}

export function createTournament(payload: CreateTournamentPayload) {
  // Tournament import is temporarily sent without auth.
  return apiPostForm<BackendCreateTournamentSuccess>(endpoints.importTournament, payloadToFormData(payload)).then(
    mapCreateTournamentResponse,
  );
}
