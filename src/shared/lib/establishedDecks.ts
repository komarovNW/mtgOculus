import type { DeckMetagameItem, DeckPerformanceItem } from '@/shared/api/types';

export const ESTABLISHED_DECK_MIN_MATCHES = 30;
export const ESTABLISHED_DECK_MIN_TOURNAMENTS = 10;

export function getEstablishedDeckPerformance(
  deckPerformance: DeckPerformanceItem[],
  deckMetagame: DeckMetagameItem[],
) {
  const metagameByDeckId = new Map(
    deckMetagame.map((item) => [item.deck.id, item]),
  );

  return [...deckPerformance]
    .filter((item) => {
      const metagame = metagameByDeckId.get(item.deck.id);

      return (
        item.matchesCount >= ESTABLISHED_DECK_MIN_MATCHES &&
        (metagame?.tournamentsCount ?? 0) >= ESTABLISHED_DECK_MIN_TOURNAMENTS
      );
    })
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount,
    );
}
