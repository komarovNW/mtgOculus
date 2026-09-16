import type {
  DeckListItem,
  DeckMetagameItem,
  DeckPerformanceItem,
} from '@/shared/api/types';

export const ESTABLISHED_DECK_SAMPLE_HINT =
  'Достаточность выборки определяет сервер по единому правилу статистики.';

export function isEstablishedDeck(
  item: Pick<DeckListItem, 'isSmallSample'>,
) {
  return !item.isSmallSample;
}

export function getEstablishedDecks(items: DeckListItem[]) {
  return [...items]
    .filter(isEstablishedDeck)
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount,
    );
}

export function getEstablishedDeckPerformance(
  deckPerformance: DeckPerformanceItem[],
  deckMetagame: DeckMetagameItem[],
) {
  const metagameByDeckId = new Map(
    deckMetagame.map((item) => [item.deck.id, item]),
  );

  return [...deckPerformance]
    .filter((item) => !item.isSmallSample && metagameByDeckId.has(item.deck.id))
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount,
    );
}
