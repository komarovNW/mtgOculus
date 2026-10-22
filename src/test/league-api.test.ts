import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLeagueDetails,
  getLeagueOptions,
  getLeagueQualifierOptions,
  getLeagues,
} from '@/entities/league/api';

afterEach(() => vi.unstubAllGlobals());

describe('league API', () => {
  it('loads lightweight league options and normalizes IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: 7,
      name: 'Осенняя лига',
      club: { id: 'portal', name: 'Портал', cityId: 'moscow' },
      format: { id: 'standard', name: 'Standard' },
      dateStart: '2026-09-01',
      dateEnd: '2026-11-30',
    }])));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getLeagueOptions({
      cityId: 'moscow',
      clubId: 'portal',
      formatId: 'standard',
      date: '2026-09-17',
    });
    const url = new URL(fetchMock.mock.calls[0][0]);

    expect(url.pathname).toBe('/api/v1/leagues/options');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      cityId: 'moscow', clubId: 'portal', formatId: 'standard', date: '2026-09-17',
    });
    expect(result[0].id).toBe('7');
  });

  it('loads free qualifier options for the selected league', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: 12,
      title: 'Store Championship',
      date: '2026-09-27',
      slots: 2,
      league: { id: 7, name: 'Осенняя лига' },
    }])));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getLeagueQualifierOptions('7');
    const url = new URL(fetchMock.mock.calls[0][0]);

    expect(url.pathname).toBe('/api/v1/leagues/qualifiers/options');
    expect(url.searchParams.get('leagueId')).toBe('7');
    expect(result[0]).toEqual(expect.objectContaining({
      id: '12',
      league: { id: '7', name: 'Осенняя лига' },
    }));
  });

  it('sends list filters using the backend pagination contract and normalizes IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: 1,
        name: 'Осенняя лига',
        club: { id: 'portal', name: 'Портал', cityId: 'moscow' },
        format: { id: 'standard', name: 'Standard' },
        dateStart: '2026-09-01',
        dateEnd: '2026-11-30',
        bestTournamentsCount: null,
        sort: ['tournamentPoints', 'bonusPoints'],
        tournamentsCount: 4,
        playersCount: 32,
      }],
    })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await getLeagues({ cityId: 'moscow', clubId: 'portal', formatId: 'standard' });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/leagues');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      cityId: 'moscow', clubId: 'portal', formatId: 'standard', page: '1', page_size: '100',
    });
    expect(result.items[0].id).toBe('1');
    expect(result.items[0].bestTournamentsCount).toBeNull();
  });

  it('preserves the dynamic table contract and normalizes nested entity IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 1,
      name: 'Осенняя лига',
      club: { id: 'portal', name: 'Портал' },
      format: { id: 'standard', name: 'Standard' },
      dateStart: '2026-09-01', dateEnd: '2026-11-30', bestTournamentsCount: null,
      sort: ['bonusPoints', 'tournamentPoints'], rules: [],
      columns: [
        { position: 2, key: 'xZeroCount', label: 'Все матчи выиграны' },
        { position: 1, key: 'tournamentPoints', label: 'Турнирные очки' },
      ],
      qualification: [{
        title: 'Ручной отбор',
        slots: 2,
        seats: [
          { player: { id: 32, name: 'Комаров Никита' }, comment: 'Победитель весенней лиги' },
          { player: null, comment: 'Лучший игрок котиками' },
        ],
      }],
      tournaments: [{ id: 673, title: 'Daily', date: '2026-09-01', playersCount: 20 }],
      standings: [{
        leagueRank: 1, rank: 1, player: { id: 25, name: 'Игрок' }, tournamentPoints: 9,
        bonusPoints: 3, rulePoints: 3, manualBonusPoints: 0, droppedTournamentPoints: 0,
        tournamentsPlayed: 1, tournamentsCounted: 1, xZeroCount: 1, xOneCount: 0,
        breakdown: [],
        participations: [{ tournamentId: 673, tournamentTitle: 'Daily', date: '2026-09-01',
          tournamentPoints: 9, rulePoints: 3, manualBonusPoints: 0, bonusReason: '', counted: true }],
      }],
    })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await getLeagueDetails('1', ['bonusPoints', 'tournamentPoints']);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/leagues/1');
    expect(url.searchParams.get('sort')).toBe('bonusPoints,tournamentPoints');
    expect(result.columns.map((column) => column.key)).toEqual(['tournamentPoints', 'xZeroCount']);
    expect(result.qualification[0].seats[0].player?.id).toBe('32');
    expect(result.qualification[0].seats[1].player).toBeNull();
    expect(result.standings[0].player.id).toBe('25');
    expect(result.standings[0].participations[0].tournamentId).toBe('673');
  });

  it('normalizes transitional qualification blocks without seats', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 1,
      name: 'Осенняя лига',
      club: { id: 'portal', name: 'Портал' },
      format: { id: 'standard', name: 'Standard' },
      dateStart: '2026-09-01',
      dateEnd: '2026-11-30',
      qualification: [
        {
          title: 'Store Championship',
          slots: 3,
          players: [{ player: { id: 32, name: 'Комаров Никита' }, place: 2 }],
        },
        { title: null, slots: 2 },
      ],
    })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getLeagueDetails('1');

    expect(result.qualification[0].seats).toEqual([
      { player: { id: '32', name: 'Комаров Никита' }, comment: null },
      { player: null, comment: null },
      { player: null, comment: null },
    ]);
    expect(result.qualification[1].seats).toEqual([
      { player: null, comment: null },
      { player: null, comment: null },
    ]);
    expect(result.columns).toEqual([]);
    expect(result.rules).toEqual([]);
    expect(result.tournaments).toEqual([]);
    expect(result.standings).toEqual([]);
  });
});
