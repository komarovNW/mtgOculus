import { apiPostForm } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import type { CreateTournamentPayload, CreateTournamentResponse } from '@/shared/api/types';

type BackendCreateTournamentResponse = {
  success: true;
  tournament: {
    id: string | number;
    title: string;
  };
  warnings?: Array<{
    message: string;
  }>;
};

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

export function createTournament(payload: CreateTournamentPayload): Promise<CreateTournamentResponse> {
  return apiPostForm<BackendCreateTournamentResponse>(
    endpoints.importTournament,
    payloadToFormData(payload),
  ).then((response) => ({
    success: true,
    tournamentId: String(response.tournament.id),
    message: `Событие «${response.tournament.title}» добавлено.`,
    warnings: response.warnings?.map((warning) => warning.message),
  }));
}
