import type {
  DeckListItem,
  DeckMetagameItem,
  DeckPerformanceItem,
} from '@/shared/api/types';

export const ESTABLISHED_DECK_MIN_MATCHES = 30;
export const ESTABLISHED_DECK_MIN_TOURNAMENTS = 10;
export const ESTABLISHED_DECK_SAMPLE_HINT =
  'Для устойчивого сравнения нужно минимум 30 матчей в 10 турнирах.';

export function isEstablishedDeck(
  item: Pick<DeckListItem, 'matchesCount' | 'tournamentsCount'>,
) {
  return (
    item.matchesCount >= ESTABLISHED_DECK_MIN_MATCHES &&
    item.tournamentsCount >= ESTABLISHED_DECK_MIN_TOURNAMENTS
  );
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
