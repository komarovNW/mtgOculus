import type {
  DeckDetailsResponse,
  DeckMatchupItem,
  DeckPlayerItem,
  TournamentDeckResultItem,
} from '@/shared/api/types';
export type DeckMonthlyActivity = {
  month: string;
  tournamentsCount: number;
  participationsCount: number;
};

function compareNames(left: string, right: string) {
  return left.localeCompare(right, 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
}

function getEstablishedMatchups(deckId: string, matchups: DeckMatchupItem[]) {
  return matchups.filter(
    (item) =>
      item.opponentDeck.id !== deckId &&
      !item.isSmallSample,
  );
}

function getBestMatchup(matchups: DeckMatchupItem[]) {
  return [...matchups].sort(
    (left, right) =>
      right.winRate - left.winRate ||
      right.matchesCount - left.matchesCount ||
      compareNames(left.opponentDeck.name, right.opponentDeck.name),
  )[0] ?? null;
}

function getWorstMatchup(matchups: DeckMatchupItem[]) {
  return [...matchups].sort(
    (left, right) =>
      left.winRate - right.winRate ||
      right.matchesCount - left.matchesCount ||
      compareNames(left.opponentDeck.name, right.opponentDeck.name),
  )[0] ?? null;
}

export function getDeckMonthlyActivity(
  tournamentResults: TournamentDeckResultItem[],
) {
  const monthly = new Map<
    string,
    Omit<DeckMonthlyActivity, 'tournamentsCount'> & {
      tournamentIds: Set<string>;
    }
  >();

  tournamentResults.forEach((item) => {
    const month = item.tournament.date.slice(0, 7);

    if (!month) {
      return;
    }

    const current = monthly.get(month) ?? {
      month,
      tournamentIds: new Set<string>(),
      participationsCount: 0,
    };

    current.tournamentIds.add(item.tournament.id);
    current.participationsCount += 1;
    monthly.set(month, current);
  });

  return [...monthly.values()]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map<DeckMonthlyActivity>((item) => ({
      month: item.month,
      tournamentsCount: item.tournamentIds.size,
      participationsCount: item.participationsCount,
    }));
}

export function getDeckDetailInsights(detail: DeckDetailsResponse) {
  const knownMatchups = detail.matchups.filter(
    (item) => item.hasKnownOpponentDeck !== false && Boolean(item.opponentDeck.id),
  );
  const establishedMatchups = getEstablishedMatchups(
    detail.deck.id,
    knownMatchups,
  );
  const matchupRowsCount = knownMatchups.reduce(
    (total, item) => total + item.matchesCount,
    0,
  );
  const playedMatchesCount = detail.summary.playedMatchesCount;
  const byesCount = detail.summary.byesCount;
  const unknownResultsCount = detail.summary.unknownResultsCount ?? 0;
  const knownMatchupsCount =
    detail.summary.matchesWithKnownOpponentDeckCount ?? matchupRowsCount;
  const unknownOpponentDeckCount =
    detail.summary.matchesWithUnknownOpponentDeckCount ??
    Math.max(0, playedMatchesCount - knownMatchupsCount);
  const monthlyActivity = getDeckMonthlyActivity(detail.tournamentResults);
  const isTournamentHistoryComplete =
    detail.tournamentResults.length === detail.summary.playersCount;
  const establishedWinRates = establishedMatchups.map((item) => item.winRate);
  const hasComparableMatchups =
    establishedMatchups.length >= 2 &&
    Math.min(...establishedWinRates) < Math.max(...establishedWinRates);
  const mostActivePlayer = [...detail.players].sort(
    (left, right) =>
      right.tournamentsCount - left.tournamentsCount ||
      right.playedMatchesCount - left.playedMatchesCount ||
      compareNames(left.player.name, right.player.name),
  )[0] ?? null;
  const bestEstablishedPlayer = detail.players
    .filter((item) => !item.isSmallSample && item.playedMatchesCount > 0)
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.playedMatchesCount - left.playedMatchesCount ||
        compareNames(left.player.name, right.player.name),
    )[0] ?? null;

  return {
    isEstablished: !detail.summary.isSmallSample,
    isTournamentHistoryComplete,
    bestMatchup: hasComparableMatchups
      ? getBestMatchup(establishedMatchups)
      : null,
    worstMatchup: hasComparableMatchups
      ? getWorstMatchup(establishedMatchups)
      : null,
    establishedMatchupsCount: establishedMatchups.length,
    hasComparableMatchups,
    knownMatchupsCount,
    playedMatchesCount,
    byesCount,
    unknownResultsCount,
    unknownOpponentDeckCount,
    monthlyActivity,
    mostActivePlayer,
    bestEstablishedPlayer,
  };
}

export function isEstablishedDeckPlayer(item: DeckPlayerItem) {
  return !item.isSmallSample;
}

export function isEstablishedMatchup(item: DeckMatchupItem) {
  return !item.isSmallSample;
}
