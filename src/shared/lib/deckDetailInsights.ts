import type {
  DeckDetailsResponse,
  DeckMatchupItem,
  DeckPlayerItem,
  TournamentDeckResultItem,
} from '@/shared/api/types';
import {
  ESTABLISHED_DECK_MIN_MATCHES,
  ESTABLISHED_DECK_MIN_TOURNAMENTS,
} from '@/shared/lib/establishedDecks';
import {
  ESTABLISHED_PLAYER_MIN_MATCHES,
  ESTABLISHED_PLAYER_MIN_TOURNAMENTS,
} from '@/shared/lib/establishedPlayers';

export const ESTABLISHED_MATCHUP_MIN_MATCHES = 10;

export type DeckMonthlyActivity = {
  month: string;
  tournamentsCount: number;
  participationsCount: number;
  matchesCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

function parseRecord(record: string) {
  const [winsRaw, lossesRaw, drawsRaw = '0'] = record.split('-');
  const wins = Number(winsRaw);
  const losses = Number(lossesRaw);
  const draws = Number(drawsRaw);

  if ([wins, losses, draws].some((value) => !Number.isFinite(value))) {
    return null;
  }

  return { wins, losses, draws };
}

function compareNames(left: string, right: string) {
  return left.localeCompare(right, 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
}

function getMostActivePlayer(players: DeckPlayerItem[]) {
  return [...players].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      right.tournamentsCount - left.tournamentsCount ||
      compareNames(left.player.name, right.player.name),
  )[0] ?? null;
}

function getMostCommonMatchup(matchups: DeckMatchupItem[]) {
  return [...matchups].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      compareNames(left.opponentDeck.name, right.opponentDeck.name),
  )[0] ?? null;
}

function getEstablishedMatchups(deckId: string, matchups: DeckMatchupItem[]) {
  return matchups.filter(
    (item) =>
      item.opponentDeck.id !== deckId &&
      item.matchesCount >= ESTABLISHED_MATCHUP_MIN_MATCHES,
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
    Omit<DeckMonthlyActivity, 'tournamentsCount' | 'winRate'> & {
      tournamentIds: Set<string>;
    }
  >();

  tournamentResults.forEach((item) => {
    const month = item.tournament.date.slice(0, 7);
    const record = parseRecord(item.record);

    if (!month || !record) {
      return;
    }

    const current = monthly.get(month) ?? {
      month,
      tournamentIds: new Set<string>(),
      participationsCount: 0,
      matchesCount: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };

    current.tournamentIds.add(item.tournament.id);
    current.participationsCount += 1;
    current.matchesCount += record.wins + record.losses + record.draws;
    current.wins += record.wins;
    current.losses += record.losses;
    current.draws += record.draws;
    monthly.set(month, current);
  });

  return [...monthly.values()]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map<DeckMonthlyActivity>((item) => ({
      month: item.month,
      tournamentsCount: item.tournamentIds.size,
      participationsCount: item.participationsCount,
      matchesCount: item.matchesCount,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate: item.matchesCount > 0 ? (item.wins / item.matchesCount) * 100 : 0,
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
  const playedMatchesCount =
    detail.summary.playedMatchesCount ?? detail.summary.matchesCount;
  const byesCount = detail.summary.byesCount ?? 0;
  const unknownResultsCount = detail.summary.unknownResultsCount ?? 0;
  const knownMatchupsCount =
    detail.summary.matchesWithKnownOpponentDeckCount ?? matchupRowsCount;
  const unknownOpponentDeckCount =
    detail.summary.matchesWithUnknownOpponentDeckCount ??
    Math.max(0, playedMatchesCount - knownMatchupsCount);
  const playerMatchesCount = detail.players.reduce(
    (total, item) => total + item.matchesCount,
    0,
  );
  const monthlyActivity = getDeckMonthlyActivity(detail.tournamentResults);
  const tournamentResultMatchesCount = monthlyActivity.reduce(
    (total, item) => total + item.matchesCount,
    0,
  );
  const establishedWinRates = establishedMatchups.map((item) => item.winRate);
  const hasComparableMatchups =
    establishedMatchups.length >= 2 &&
    Math.min(...establishedWinRates) < Math.max(...establishedWinRates);

  return {
    isEstablished:
      playedMatchesCount >= ESTABLISHED_DECK_MIN_MATCHES &&
      detail.summary.tournamentsCount >= ESTABLISHED_DECK_MIN_TOURNAMENTS,
    isPlayerHistoryComplete:
      playerMatchesCount === playedMatchesCount,
    isTournamentHistoryComplete:
      tournamentResultMatchesCount === playedMatchesCount,
    mostActivePlayer:
      playerMatchesCount === playedMatchesCount
        ? getMostActivePlayer(detail.players)
        : null,
    mostCommonMatchup: getMostCommonMatchup(knownMatchups),
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
    unknownMatchupsCount: unknownOpponentDeckCount,
    monthlyActivity:
      tournamentResultMatchesCount === playedMatchesCount
        ? monthlyActivity
        : [],
  };
}

export function isEstablishedDeckPlayer(item: DeckPlayerItem) {
  return (
    item.matchesCount >= ESTABLISHED_PLAYER_MIN_MATCHES &&
    item.tournamentsCount >= ESTABLISHED_PLAYER_MIN_TOURNAMENTS
  );
}

export function isEstablishedMatchup(item: DeckMatchupItem) {
  return item.matchesCount >= ESTABLISHED_MATCHUP_MIN_MATCHES;
}
