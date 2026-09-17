import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTournament } from '@/entities/admin-tournament/api';
import { apiPostForm, AppError } from '@/shared/api/client';

const backendFeedback = {
  success: false,
  errors: [
    {
      code: 'DECK_PLAYER_NOT_FOUND_IN_STANDINGS',
      message:
        'Игрок "Колошко Александр" из списка колод отсутствует в стендингах.',
      source: 'playerDecksText',
      playerName: 'Колошко Александр',
    },
    {
      code: 'INVALID_MATCH_SCORE',
      message: 'Некорректный счёт матча в раунде 5, столе 11.',
      source: 'allRoundsFile',
      roundNumber: 5,
      tableNumber: 11,
      rawValue: '2-1-1',
    },
  ],
  warnings: [
    {
      code: 'PLAYER_NAME_NORMALIZED',
      message:
        'Имя "Панферов Александр" сопоставлено с "Панфёров Александр".',
      source: 'playerDecksText',
      rawValue: 'Панферов Александр',
      matchedValue: 'Панфёров Александр',
    },
  ],
};

describe('import API feedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves structured errors and warnings from an unsuccessful HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(backendFeedback), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const request = apiPostForm('/admin/tournaments/import', new FormData());

    await expect(request).rejects.toMatchObject({
      name: 'AppError',
      code: 'DECK_PLAYER_NOT_FOUND_IN_STANDINGS',
      details: backendFeedback.errors,
      warnings: backendFeedback.warnings,
    });
  });

  it('rejects success false even when backend responds with HTTP 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(backendFeedback), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const request = createTournament({
      date: '2026-07-24',
      cityId: 'moscow',
      clubId: 'club',
      tournamentType: 'daily',
      formatId: 'legacy',
      aetherhubUrl:
        'https://aetherhub.com/Tourney/RoundTourney/100523',
      playerDecksText: 'Колошко Александр - Lands',
    });

    await expect(request).rejects.toBeInstanceOf(AppError);
    await expect(request).rejects.toMatchObject({
      code: 'DECK_PLAYER_NOT_FOUND_IN_STANDINGS',
      details: backendFeedback.errors,
      warnings: backendFeedback.warnings,
    });
  });

  it('sends the selected league with the import form', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        tournament: { id: 145, title: 'Pauper Daily' },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await createTournament({
      date: '2026-09-17',
      cityId: 'moscow',
      clubId: 'goldfish_msk',
      tournamentType: 'daily',
      formatId: 'pauper',
      leagueId: '7',
      aetherhubUrl: 'https://aetherhub.com/Tourney/RoundTourney/100523',
      playerDecksText: 'Игрок - Колода',
    });

    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get('leagueId')).toBe('7');
  });
});
