import { wait } from '@/shared/api/mocks/helpers';
import type { CreateTournamentPayload, CreateTournamentResponse } from '@/shared/api/types';

export async function createTournamentMock(
  payload: CreateTournamentPayload,
): Promise<CreateTournamentResponse> {
  const warnings =
    payload.playerDecksText.trim().split('\n').filter(Boolean).length < 4
      ? ['В импорт попало меньше четырёх строк player -> deck. Проверьте полноту данных.']
      : undefined;

  return wait({
    success: true,
    tournamentId: `mock_${payload.date}_${payload.clubId}`,
    message: 'Турнир успешно импортирован в mock-режиме.',
    warnings,
  }, 420);
}

