import { describe, expect, it } from 'vitest';
import type { DeckMetagameItem, DeckPerformanceItem } from '@/shared/api/types';
import { getEstablishedDeckPerformance } from '@/shared/lib/establishedDecks';

function performance(
  id: string,
  matchesCount: number,
  matchWinRate: number,
): DeckPerformanceItem {
  const matchWins = Math.round((matchesCount * matchWinRate) / 100);

  return {
    deck: { id, name: id },
    matchesCount,
    matchWins,
    matchLosses: matchesCount - matchWins,
    matchDraws: 0,
    matchWinRate,
    isSmallSample: false,
  };
}

function metagame(id: string, tournamentsCount: number): DeckMetagameItem {
  return {
    deck: { id, name: id },
    playersCount: tournamentsCount,
    tournamentsCount,
    metaShare: 1,
  };
}

describe('getEstablishedDeckPerformance', () => {
  it('excludes high win rates based on too few matches or tournaments', () => {
    const result = getEstablishedDeckPerformance(
      [
        performance('four-matches', 4, 100),
        performance('two-tournaments', 40, 80),
        performance('established', 52, 73.08),
        performance('established-lower', 80, 65),
      ],
      [
        metagame('four-matches', 1),
        metagame('two-tournaments', 2),
        metagame('established', 13),
        metagame('established-lower', 20),
      ],
    );

    expect(result.map((item) => item.deck.id)).toEqual([
      'established',
      'established-lower',
    ]);
  });
});
