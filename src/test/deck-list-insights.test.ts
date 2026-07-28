import { describe, expect, it } from 'vitest';
import type { DeckListItem } from '@/shared/api/types';
import { getDeckListInsights } from '@/shared/lib/deckListInsights';

function deck(
  id: string,
  tournamentsCount: number,
  matchesCount: number,
  matchWinRate: number,
  playersCount: number,
): DeckListItem {
  const matchWins = Math.round((matchesCount * matchWinRate) / 100);

  return {
    deck: { id, name: id },
    format: { id: 'legacy', name: 'Legacy' },
    tournamentsCount,
    playersCount,
    matchesCount,
    matchWins,
    matchLosses: matchesCount - matchWins,
    matchDraws: 0,
    matchWinRate,
    isSmallSample: false,
  };
}

describe('getDeckListInsights', () => {
  it('builds deck analytics from the complete collection', () => {
    const result = getDeckListInsights([
      deck('one-off', 1, 4, 100, 1),
      deck('best-established', 15, 55, 75, 10),
      deck('most-popular', 40, 160, 60, 50),
      deck('five-nine', 8, 30, 65, 8),
    ]);

    expect(result.mostPopularDeck?.deck.id).toBe('most-popular');
    expect(result.bestEstablishedDeck?.deck.id).toBe('best-established');
    expect(result.establishedDecksCount).toBe(2);
    expect(result.establishedDecksShare).toBe(50);
    expect(result.medianMatches).toBe(42.5);
    expect(result.medianTournaments).toBe(11.5);
    expect(result.topTenParticipationsShare).toBe(100);
    expect(result.activityGroups.map((group) => group.decksCount)).toEqual([
      1,
      0,
      1,
      1,
      1,
    ]);
  });
});
