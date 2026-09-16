import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLeagueDetails, getLeagues } from '@/entities/league/api';

afterEach(() => vi.unstubAllGlobals());

describe('league API', () => {
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

  it('passes the ordered server sort and normalizes nested entity IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 1,
      name: 'Осенняя лига',
      club: { id: 'portal', name: 'Портал' },
      format: { id: 'standard', name: 'Standard' },
      dateStart: '2026-09-01', dateEnd: '2026-11-30', bestTournamentsCount: null,
      sort: ['bonusPoints', 'tournamentPoints'], rules: [],
      tournaments: [{ id: 673, title: 'Daily', date: '2026-09-01', playersCount: 20 }],
      standings: [{
        leagueRank: 1, rank: 1, player: { id: 25, name: 'Игрок' }, tournamentPoints: 9,
        bonusPoints: 3, rulePoints: 3, manualBonusPoints: 0, droppedTournamentPoints: 0,
        tournamentsPlayed: 1, tournamentsCounted: 1, breakdown: [],
        participations: [{ tournamentId: 673, tournamentTitle: 'Daily', date: '2026-09-01',
          tournamentPoints: 9, rulePoints: 3, manualBonusPoints: 0, bonusReason: '', counted: true }],
      }],
    })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await getLeagueDetails('1', ['bonusPoints', 'tournamentPoints']);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/leagues/1');
    expect(url.searchParams.get('sort')).toBe('bonusPoints,tournamentPoints');
    expect(result.standings[0].player.id).toBe('25');
    expect(result.standings[0].participations[0].tournamentId).toBe('673');
  });
});
