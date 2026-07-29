import { apiPostForm, AppError } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import type {
  CreateTournamentPayload,
  CreateTournamentResponse,
  ImportFeedbackItem,
} from '@/shared/api/types';

type BackendCreateTournamentSuccessResponse = {
  success: true;
  tournament: {
    id: string | number;
    title: string;
  };
  warnings?: ImportFeedbackItem[];
};

type BackendCreateTournamentErrorResponse = {
  success: false;
  errors?: ImportFeedbackItem[];
  warnings?: ImportFeedbackItem[];
};

type BackendCreateTournamentResponse =
  | BackendCreateTournamentSuccessResponse
  | BackendCreateTournamentErrorResponse;

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
  ).then((response) => {
    if (!response.success) {
      const details = response.errors ?? [];

      throw new AppError({
        status: 422,
        code: details[0]?.code ?? 'IMPORT_FAILED',
        message:
          details[0]?.message ??
          'Backend не смог добавить событие, но не сообщил причину.',
        details,
        warnings: response.warnings ?? [],
      });
    }

    return {
      success: true,
      tournamentId: String(response.tournament.id),
      message: `Событие «${response.tournament.title}» добавлено.`,
      warnings: response.warnings,
    };
  });
}
