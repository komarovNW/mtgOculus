import type { DeckListItem } from '@/shared/api/types';
import { getEstablishedDecks } from '@/shared/lib/establishedDecks';

function getMedian(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function getDeckListInsights(items: DeckListItem[]) {
  const establishedDecks = getEstablishedDecks(items);
  const mostPopularDeck = [...items].sort(
    (left, right) =>
      right.playersCount - left.playersCount ||
      right.tournamentsCount - left.tournamentsCount ||
      right.matchesCount - left.matchesCount,
  )[0];
  const totalParticipations = items.reduce(
    (sum, item) => sum + item.playersCount,
    0,
  );
  const topTenParticipations = [...items]
    .sort((left, right) => right.playersCount - left.playersCount)
    .slice(0, 10)
    .reduce((sum, item) => sum + item.playersCount, 0);
  const activityGroups = [
    {
      id: 'one',
      label: '1 турнир',
      decksCount: items.filter((item) => item.tournamentsCount <= 1).length,
    },
    {
      id: 'two-four',
      label: '2–4 турнира',
      decksCount: items.filter(
        (item) => item.tournamentsCount >= 2 && item.tournamentsCount <= 4,
      ).length,
    },
    {
      id: 'five-nine',
      label: '5–9 турниров',
      decksCount: items.filter(
        (item) => item.tournamentsCount >= 5 && item.tournamentsCount <= 9,
      ).length,
    },
    {
      id: 'ten-twenty-four',
      label: '10–24 турнира',
      decksCount: items.filter(
        (item) => item.tournamentsCount >= 10 && item.tournamentsCount <= 24,
      ).length,
    },
    {
      id: 'twenty-five-plus',
      label: '25+ турниров',
      decksCount: items.filter((item) => item.tournamentsCount >= 25).length,
    },
  ].map((group) => ({
    ...group,
    decksShare: items.length ? (group.decksCount / items.length) * 100 : 0,
  }));

  return {
    activityGroups,
    bestEstablishedDeck: establishedDecks[0],
    establishedDecks: establishedDecks.slice(0, 5),
    establishedDecksCount: establishedDecks.length,
    establishedDecksShare: items.length
      ? (establishedDecks.length / items.length) * 100
      : 0,
    medianMatches: getMedian(items.map((item) => item.matchesCount)),
    medianTournaments: getMedian(items.map((item) => item.tournamentsCount)),
    mostPopularDeck,
    topTenParticipationsShare: totalParticipations
      ? (topTenParticipations / totalParticipations) * 100
      : 0,
  };
}
