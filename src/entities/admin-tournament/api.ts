import { analyzePlayerDecksInput } from '@/shared/lib/playerDecksInput';
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
  formData.set('formatId', payload.formatId);
  if (payload.tournamentType === 'daily' && payload.leagueId) {
    formData.set('leagueId', payload.leagueId);
  }
  if (payload.aetherhubUrl.trim()) formData.set('aetherhubUrl', payload.aetherhubUrl.trim());
  formData.set('playerDecksText', payload.playerDecksText);

  for (const key of ['finalStandingsFile', 'allRoundsFile'] as const) {
    if (payload[key]) formData.set(key, payload[key]);
  }
  if (payload.includeInMatchupMatrix !== undefined) {
    formData.set('includeInMatchupMatrix', String(payload.includeInMatchupMatrix));
  }
  if (payload.tournamentType === 'tournament') {
    if (payload.leagueQualifierId) {
      formData.set('leagueQualifierId', payload.leagueQualifierId);
    }
    if (payload.noPlayoff) {
      formData.set('noPlayoff', 'true');
    } else {
      if (payload.playoffMatches?.length) formData.set('playoffMatches', JSON.stringify(payload.playoffMatches));
      if (payload.decksOrder && analyzePlayerDecksInput(payload.playerDecksText).mode === 'ordered') formData.set('decksOrder', payload.decksOrder);
    }
  }
  return formData;
}

function meleePayloadToFormData(payload: CreateTournamentPayload) {
  const formData = new FormData();
  formData.set('meleeUrl', payload.meleeUrl?.trim() ?? '');
  formData.set('playerDecksText', payload.playerDecksText);
  formData.set('date', payload.date);
  formData.set('cityId', payload.cityId);
  formData.set('clubId', payload.clubId);
  formData.set('formatId', payload.formatId);

  if (payload.leagueQualifierId) {
    formData.set('leagueQualifierId', payload.leagueQualifierId);
  }

  if (
    payload.decksOrder &&
    analyzePlayerDecksInput(payload.playerDecksText).mode === 'ordered'
  ) {
    formData.set('decksOrder', payload.decksOrder);
  }

  return formData;
}

export function createTournament(payload: CreateTournamentPayload): Promise<CreateTournamentResponse> {
  const isMeleeImport =
    payload.tournamentType === 'tournament' &&
    payload.tournamentImportSource === 'melee';

  return apiPostForm<BackendCreateTournamentResponse>(
    isMeleeImport
      ? endpoints.importTournamentFromMelee
      : payload.tournamentType === 'daily'
        ? endpoints.importDaily
        : endpoints.importTournament,
    isMeleeImport ? meleePayloadToFormData(payload) : payloadToFormData(payload),
    isMeleeImport ? { timeoutMs: 120_000 } : undefined,
  ).then((response) => {
    if (!response.success) {
      const details = response.errors ?? [];

      throw new AppError({
        status: 422,
        code: details[0]?.code ?? 'IMPORT_FAILED',
        message:
          details[0]?.message ??
          'Не удалось добавить событие. Попробуйте ещё раз.',
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
