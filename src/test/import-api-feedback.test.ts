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

    const request = apiPostForm('/admin/imports/daily', new FormData());

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
    expect(String(fetchMock.mock.calls[0][0])).toContain('/admin/imports/daily');
    expect(body.has('tournamentType')).toBe(false);
    expect(body.has('playoffMatches')).toBe(false);
  });
});


describe('new tournament import contract', () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([false, true])('sends tournament fields with noPlayoff=%s', async (noPlayoff) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, tournament: { id: 1, title: 'Cup' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const playoffMatches = [{ topN: 2, playerA: 'A', playerB: 'B', playerAWins: 2, playerBWins: 1 }];
    await createTournament({
      date: '2026-10-21', cityId: 'moscow', clubId: 'club', formatId: 'legacy',
      tournamentType: 'tournament', leagueId: '7', aetherhubUrl: '', playerDecksText: 'Lands',
      noPlayoff, playoffMatches, decksOrder: 'swiss', includeInMatchupMatrix: false,
      finalStandingsFile: new File(['standings'], 'standings.html'), allRoundsFile: new File(['rounds'], 'rounds.html'),
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/admin/imports/tournament');
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.has('leagueId')).toBe(false);
    expect(body.has('tournamentType')).toBe(false);
    expect(body.get('includeInMatchupMatrix')).toBe('false');
    expect(body.get('finalStandingsFile')).toBeInstanceOf(File);
    expect(body.get('allRoundsFile')).toBeInstanceOf(File);
    expect(body.get('noPlayoff')).toBe(noPlayoff ? 'true' : null);
    expect(body.get('playoffMatches')).toBe(noPlayoff ? null : JSON.stringify(playoffMatches));
    expect(body.get('decksOrder')).toBe(noPlayoff ? null : 'swiss');
  });
});

describe('Melee tournament import contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends only Melee fields to the dedicated endpoint with a request timeout', async () => {
    const timeoutSpy = vi.spyOn(window, 'setTimeout');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      tournament: { id: 2, title: 'Melee Cup' },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await createTournament({
      date: '2026-10-21',
      cityId: 'moscow',
      clubId: 'club',
      formatId: 'legacy',
      tournamentType: 'tournament',
      tournamentImportSource: 'melee',
      leagueQualifierId: '12',
      meleeUrl: 'https://melee.gg/Tournament/View/12345',
      aetherhubUrl: 'https://aetherhub.com/Tourney/ignored',
      playerDecksText: 'Lands\nDoomsday',
      decksOrder: 'final',
      leagueId: '7',
      noPlayoff: true,
      playoffMatches: [{
        topN: 2,
        playerA: 'A',
        playerB: 'B',
        playerAWins: 2,
        playerBWins: 0,
      }],
      includeInMatchupMatrix: true,
      finalStandingsFile: new File(['standings'], 'standings.html'),
      allRoundsFile: new File(['rounds'], 'rounds.html'),
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain('/admin/imports/tournament/melee');
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 120_000);

    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(Array.from(body.keys()).sort()).toEqual([
      'cityId',
      'clubId',
      'date',
      'decksOrder',
      'formatId',
      'leagueQualifierId',
      'meleeUrl',
      'playerDecksText',
    ]);
    expect(body.get('meleeUrl')).toBe('https://melee.gg/Tournament/View/12345');
    expect(body.get('decksOrder')).toBe('final');
    expect(body.get('leagueQualifierId')).toBe('12');
  });

  it.each([
    'MELEE_FETCH_ERROR',
    'MELEE_PARSE_ERROR',
    'MELEE_TOURNAMENT_INCOMPLETE',
    'MELEE_UNSUPPORTED_TOURNAMENT',
  ])('preserves backend error %s for the Melee field', async (code) => {
    const errors = [{ code, message: 'Ошибка импорта Melee.gg', source: 'meleeUrl' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      errors,
      warnings: [],
    }), { status: 422 })));

    await expect(apiPostForm('/admin/imports/tournament/melee', new FormData()))
      .rejects.toMatchObject({ code, details: errors });
  });
});


it.each(['PLAYOFF_REQUIRED', 'PLAYOFF_CONFLICTS_WITH_NO_PLAYOFF', 'PLAYOFF_PLAYER_NOT_FOUND_IN_STANDINGS', 'INVALID_PLAYOFF_BRACKET', 'PLAYOFF_MATCH_WITHOUT_WINNER', 'DECKS_ORDER_REQUIRED'])('preserves backend error %s and the Swiss top warning', async (code) => {
  const errors = [{ code, message: 'Ошибка плей-офф', source: 'playoffMatches' }];
  const warnings = [{ code: 'PLAYOFF_PLAYER_OUTSIDE_SWISS_TOP', message: 'Игрок вне топа швейцарки', source: 'playoffMatches' }];
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, errors, warnings }), { status: 422 })));
  try {
    await expect(apiPostForm('/admin/imports/tournament', new FormData())).rejects.toMatchObject({ code, details: errors, warnings });
  } finally {
    vi.unstubAllGlobals();
  }
});


it.each(['daily', 'tournament'] as const)('omits stale playoff options for named decks on %s', async (tournamentType) => {
  const warnings = [{ code: 'PLAYOFF_PLAYER_OUTSIDE_SWISS_TOP', message: 'Проверьте игрока топа.' }];
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, tournament: { id: 1, title: 'Event' }, warnings }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  try {
    const result = await createTournament({
      tournamentType, date: '2026-10-21', cityId: 'moscow', clubId: 'club', formatId: 'legacy',
      aetherhubUrl: '', playerDecksText: 'Игрок - Lands', decksOrder: 'swiss',
      playoffMatches: [{ topN: 2, playerA: 'Игрок', playerB: 'Оппонент', playerAWins: 2, playerBWins: 1, draws: 1 }],
    });
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.has('decksOrder')).toBe(false);
    expect(body.has('aetherhubUrl')).toBe(false);
    expect(body.has('playoffMatches')).toBe(tournamentType === 'tournament');
    expect(result.warnings).toEqual(warnings);
    if (tournamentType === 'tournament') expect(JSON.parse(String(body.get('playoffMatches')))[0].draws).toBe(1);
  } finally {
    vi.unstubAllGlobals();
  }
});
