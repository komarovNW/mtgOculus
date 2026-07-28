import { describe, expect, it } from 'vitest';
import type { PlayerMatchItem } from '@/shared/api/types';
import {
  getPlayerFavoriteFormat,
  getPlayerOpponentList,
  getPlayerOpponentStats,
  OPPONENT_WIN_RATE_MIN_MATCHES,
} from '@/shared/lib/playerStats';

function createMatch({
  formatId = 'legacy',
  opponentId,
  result,
  tournamentId,
}: {
  formatId?: string;
  opponentId: string;
  result: PlayerMatchItem['result'];
  tournamentId: string;
}): PlayerMatchItem {
  return {
    tournament: {
      id: tournamentId,
      title: tournamentId,
      date: '2026-01-01',
      format: { id: formatId, name: formatId === 'legacy' ? 'Legacy' : 'Modern' },
    },
    roundNumber: 1,
    tableNumber: 1,
    opponent: { id: opponentId, name: `Оппонент ${opponentId}` },
    playerScore: result === 'win' ? 2 : result === 'loss' ? 0 : 1,
    opponentScore: result === 'win' ? 0 : result === 'loss' ? 2 : 1,
    scoreText: result === 'win' ? '2-0' : result === 'loss' ? '0-2' : '1-1',
    result,
  };
}

describe('player stats calculated from matches', () => {
  it('finds frequent, best and worst opponents with a five-match cutoff', () => {
    const matches = [
      ...['win', 'win', 'win', 'win', 'loss'].map((result, index) =>
        createMatch({
          opponentId: 'a',
          result: result as PlayerMatchItem['result'],
          tournamentId: `a-${index}`,
        }),
      ),
      ...['win', 'loss', 'loss', 'loss', 'loss', 'loss'].map((result, index) =>
        createMatch({
          opponentId: 'b',
          result: result as PlayerMatchItem['result'],
          tournamentId: `b-${index}`,
        }),
      ),
      ...['win', 'win', 'win', 'win'].map((result, index) =>
        createMatch({
          opponentId: 'c',
          result: result as PlayerMatchItem['result'],
          tournamentId: `c-${index}`,
        }),
      ),
    ];

    const stats = getPlayerOpponentStats(matches);

    expect(OPPONENT_WIN_RATE_MIN_MATCHES).toBe(5);
    expect(stats.mostFrequentOpponent?.opponent.id).toBe('b');
    expect(stats.bestWinRateOpponent?.opponent.id).toBe('a');
    expect(stats.bestWinRateOpponent?.matchWinRate).toBe(80);
    expect(stats.worstWinRateOpponent?.opponent.id).toBe('b');
    expect(stats.worstWinRateOpponent?.matchWinRate).toBeCloseTo(16.67, 2);

    const opponents = getPlayerOpponentList(matches);

    expect(opponents[0]).toEqual(
      expect.objectContaining({
        matchesCount: 6,
        matchWins: 1,
        matchLosses: 5,
      }),
    );
  });

  it('returns no winrate leaders when nobody reached the cutoff', () => {
    const matches = ['win', 'win', 'loss', 'draw'].map((result, index) =>
      createMatch({
        opponentId: 'a',
        result: result as PlayerMatchItem['result'],
        tournamentId: `t-${index}`,
      }),
    );

    const stats = getPlayerOpponentStats(matches);

    expect(stats.mostFrequentOpponent?.matchesCount).toBe(4);
    expect(stats.bestWinRateOpponent).toBeNull();
    expect(stats.worstWinRateOpponent).toBeNull();
  });

  it('chooses a favorite format by matches and counts unique tournaments', () => {
    const matches = [
      createMatch({ opponentId: 'a', result: 'win', tournamentId: 'legacy-1' }),
      createMatch({ opponentId: 'b', result: 'loss', tournamentId: 'legacy-1' }),
      createMatch({ opponentId: 'c', result: 'win', tournamentId: 'legacy-2' }),
      createMatch({ formatId: 'modern', opponentId: 'd', result: 'win', tournamentId: 'modern-1' }),
      createMatch({ formatId: 'modern', opponentId: 'e', result: 'loss', tournamentId: 'modern-2' }),
    ];

    expect(getPlayerFavoriteFormat(matches)).toEqual({
      format: { id: 'legacy', name: 'Legacy' },
      matchesCount: 3,
      tournamentsCount: 2,
    });
  });
});
