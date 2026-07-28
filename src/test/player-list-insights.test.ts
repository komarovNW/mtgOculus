import { describe, expect, it } from 'vitest';
import type { TopPlayerItem } from '@/shared/api/types';
import { getPlayerListInsights } from '@/shared/lib/playerListInsights';

function player(
  id: string,
  tournamentsCount: number,
  matchesCount: number,
  matchWinRate: number,
  deckId?: string,
): TopPlayerItem {
  const matchWins = Math.round((matchesCount * matchWinRate) / 100);

  return {
    player: { id, name: id },
    tournamentsCount,
    matchesCount,
    matchWins,
    matchLosses: matchesCount - matchWins,
    matchDraws: 0,
    matchWinRate,
    mostPlayedDeck: deckId ? { id: deckId, name: deckId } : undefined,
    isSmallSample: false,
  };
}

describe('getPlayerListInsights', () => {
  it('builds useful insights from established players', () => {
    const result = getPlayerListInsights([
      player('one-off', 1, 1, 100, 'deck-b'),
      player('best-established', 15, 55, 74.55, 'deck-a'),
      player('most-active', 40, 160, 65, 'deck-a'),
      player('another-established', 8, 30, 60, 'deck-b'),
    ]);

    expect(result.bestEstablishedPlayer?.player.id).toBe('best-established');
    expect(result.mostActivePlayer?.player.id).toBe('most-active');
    expect(result.establishedPlayersCount).toBe(3);
    expect(result.establishedPlayersShare).toBe(75);
    expect(result.medianMatches).toBe(42.5);
    expect(result.medianTournaments).toBe(11.5);
    expect(result.topTenMatchesShare).toBe(100);
    expect(result.activityGroups.map((group) => group.playersCount)).toEqual([
      1,
      0,
      1,
      1,
      1,
    ]);
    expect(result.favoriteDecks[0]).toMatchObject({
      deck: { id: 'deck-a' },
      playersCount: 2,
    });
    expect(result.favoriteDecks).toHaveLength(2);
  });
});
