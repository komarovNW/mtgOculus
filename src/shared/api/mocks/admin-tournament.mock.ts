import { wait } from '@/shared/api/mocks/helpers';
import type { CreateTournamentPayload, CreateTournamentResponse } from '@/shared/api/types';

export async function createTournamentMock(
  payload: CreateTournamentPayload,
): Promise<CreateTournamentResponse> {
  const warnings =
    payload.playerDecksText.trim().split('\n').filter(Boolean).length < 4
      ? ['В списке игроков и колод меньше четырёх строк. Проверьте, все ли участники добавлены.']
      : undefined;

  return wait({
    success: true,
    tournamentId: `mock_${payload.date}_${payload.clubId}`,
    message: 'Турнир успешно загружен в демо-режиме.',
    warnings,
  }, 420);
}
