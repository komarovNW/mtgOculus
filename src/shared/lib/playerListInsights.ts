import type { TopPlayerItem } from '@/shared/api/types';
import { getEstablishedPlayers } from '@/shared/lib/establishedPlayers';

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

export function getPlayerListInsights(items: TopPlayerItem[]) {
  const establishedPlayers = getEstablishedPlayers(items);
  const bestEstablishedPlayer = establishedPlayers[0];
  const mostActivePlayer = [...items].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      right.tournamentsCount - left.tournamentsCount,
  )[0];
  const favoriteDeckCounts = new Map<
    string,
    { deck: NonNullable<TopPlayerItem['mostPlayedDeck']>; playersCount: number }
  >();

  establishedPlayers.forEach((item) => {
    if (!item.mostPlayedDeck) {
      return;
    }

    const current = favoriteDeckCounts.get(item.mostPlayedDeck.id);

    favoriteDeckCounts.set(item.mostPlayedDeck.id, {
      deck: item.mostPlayedDeck,
      playersCount: (current?.playersCount ?? 0) + 1,
    });
  });

  const favoriteDecks = [...favoriteDeckCounts.values()]
    .sort(
      (left, right) =>
        right.playersCount - left.playersCount ||
        left.deck.name.localeCompare(right.deck.name, 'ru'),
    )
    .map((item) => ({
      ...item,
      playersShare: establishedPlayers.length
        ? (item.playersCount / establishedPlayers.length) * 100
        : 0,
    }));
  const totalMatches = items.reduce((sum, item) => sum + item.matchesCount, 0);
  const topTenMatches = [...items]
    .sort((left, right) => right.matchesCount - left.matchesCount)
    .slice(0, 10)
    .reduce((sum, item) => sum + item.matchesCount, 0);
  const activityGroups = [
    {
      id: 'one',
      label: '1 турнир',
      playersCount: items.filter((item) => item.tournamentsCount <= 1).length,
    },
    {
      id: 'two-four',
      label: '2–4 турнира',
      playersCount: items.filter(
        (item) => item.tournamentsCount >= 2 && item.tournamentsCount <= 4,
      ).length,
    },
    {
      id: 'five-nine',
      label: '5–9 турниров',
      playersCount: items.filter(
        (item) => item.tournamentsCount >= 5 && item.tournamentsCount <= 9,
      ).length,
    },
    {
      id: 'ten-twenty-four',
      label: '10–24 турнира',
      playersCount: items.filter(
        (item) => item.tournamentsCount >= 10 && item.tournamentsCount <= 24,
      ).length,
    },
    {
      id: 'twenty-five-plus',
      label: '25+ турниров',
      playersCount: items.filter((item) => item.tournamentsCount >= 25).length,
    },
  ].map((group) => ({
    ...group,
    playersShare: items.length ? (group.playersCount / items.length) * 100 : 0,
  }));

  return {
    activityGroups,
    establishedPlayersShare: items.length
      ? (establishedPlayers.length / items.length) * 100
      : 0,
    establishedPlayersCount: establishedPlayers.length,
    favoriteDecks: favoriteDecks.slice(0, 5),
    bestEstablishedPlayer,
    medianMatches: getMedian(items.map((item) => item.matchesCount)),
    medianTournaments: getMedian(items.map((item) => item.tournamentsCount)),
    mostActivePlayer,
    topTenMatchesShare: totalMatches ? (topTenMatches / totalMatches) * 100 : 0,
  };
}
