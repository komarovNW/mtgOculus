import { describe, expect, it } from 'vitest';
import {
  mapAppliedFilters,
  mapPlayerDetailsResponse,
  mapPlayersListResponse,
  type BackendPlayerDetailsResponse,
  type BackendPlayersListResponse,
} from '@/shared/api/backend-mappers';

describe('backend source of truth', () => {
  it('preserves played-match totals and win rate instead of deriving them from technical wins', () => {
    const raw: BackendPlayerDetailsResponse = {
      player: { id: 32, name: 'Игрок' },
      summary: {
        tournamentsCount: 27,
        matchesCount: 106,
        playedMatchesCount: 104,
        byesCount: 2,
        matchWins: 52,
        matchLosses: 54,
        matchDraws: 0,
        playedWins: 50,
        matchWinRate: 48.08,
        gameWins: 131,
        gameLosses: 134,
        gameDraws: 0,
        gameWinRate: 49.43,
        bestRank: 2,
        averageRank: 14.07,
        uniqueDecksCount: 1,
        isSmallSample: false,
      },
      tournaments: [],
      decks: [{
        deck: { id: 235, name: 'UR Tempo' },
        tournamentsCount: 20,
        matchesCount: 78,
        playedMatchesCount: 77,
        byesCount: 1,
        matchWins: 38,
        matchLosses: 40,
        matchDraws: 0,
        playedWins: 37,
        matchWinRate: 48.05,
        bestRank: 2,
        isSmallSample: false,
      }],
      recentMatches: [],
    };

    const result = mapPlayerDetailsResponse(raw, {});

    expect(result.summary).toMatchObject({
      matchesCount: 106,
      playedMatchesCount: 104,
      byesCount: 2,
      matchWins: 52,
      playedWins: 50,
      matchWinRate: 48.08,
      isSmallSample: false,
    });
    expect(result.decks[0]).toMatchObject({
      playedMatchesCount: 77,
      byesCount: 1,
      playedWins: 37,
      matchWinRate: 48.05,
    });
  });

  it('keeps a league returned in applied filters', () => {
    expect(mapAppliedFilters({ league: { id: 7, name: 'Осенняя лига' } }))
      .toMatchObject({ league: { id: '7', name: 'Осенняя лига' } });
  });

  it('preserves player activity and undefeated-top fields supplied by the backend', () => {
    const raw: BackendPlayersListResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{
        player: { id: 3, name: 'Игрок' },
        tournamentsCount: 12,
        lastTournamentDate: '2026-09-12',
        undefeatedTopsCount: 3,
        matchesCount: 48,
        playedMatchesCount: 47,
        byesCount: 1,
        matchWins: 30,
        matchLosses: 17,
        matchDraws: 1,
        playedWins: 29,
        matchWinRate: 62.77,
        isSmallSample: false,
      }],
    };

    const result = mapPlayersListResponse(raw, {}, 1, 50);

    expect(result.items[0]).toMatchObject({
      lastTournamentDate: '2026-09-12',
      undefeatedTopsCount: 3,
    });
  });
});
