import type {
  PlayerDeckItem,
  PlayerDetailsResponse,
  PlayerMatchItem,
} from '@/shared/api/types';
import {
  getPlayerFavoriteFormat,
  getPlayerOpponentStats,
} from '@/shared/lib/playerStats';

export const PLAYER_DETAIL_MIN_MATCHES = 5;
export const PLAYER_DETAIL_MIN_TOURNAMENTS = 2;
export const PLAYER_DETAIL_SAMPLE_HINT =
  'Для статистики на личной странице нужно минимум 5 матчей в 2 событиях.';

export type PlayerMatchRecord = {
  matchesCount: number;
  playedMatchesCount: number;
  byesCount: number;
  unknownResultsCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

export type PlayerMonthlyActivity = PlayerMatchRecord & {
  month: string;
  tournamentsCount: number;
};

export type PlayerMatchGroup = {
  tournament: PlayerMatchItem['tournament'];
  matches: PlayerMatchItem[];
  record: PlayerMatchRecord;
};

export function getPlayerMatchKind(match: PlayerMatchItem) {
  if (match.kind) {
    return match.kind;
  }

  if (
    match.isBye === true ||
    match.opponent?.id === 'player_bye' ||
    match.opponent?.name.trim().toUpperCase() === 'BYE'
  ) {
    return 'bye';
  }

  return match.opponent ? 'played' : 'unknown';
}

function compareNames(left: string, right: string) {
  return left.localeCompare(right, 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
}

export function getPlayerMatchRecord(
  matches: PlayerMatchItem[],
): PlayerMatchRecord {
  const knownResults = matches.filter(
    (item) => getPlayerMatchKind(item) !== 'unknown',
  );
  const wins = knownResults.filter((item) => item.result === 'win').length;
  const losses = knownResults.filter((item) => item.result === 'loss').length;
  const draws = knownResults.filter((item) => item.result === 'draw').length;
  const matchesCount = wins + losses + draws;
  const byesCount = knownResults.filter(
    (item) => getPlayerMatchKind(item) === 'bye',
  ).length;

  return {
    matchesCount,
    playedMatchesCount: matchesCount - byesCount,
    byesCount,
    unknownResultsCount: matches.length - knownResults.length,
    wins,
    losses,
    draws,
    winRate: matchesCount > 0 ? (wins / matchesCount) * 100 : 0,
  };
}

export function sortPlayerMatches(matches: PlayerMatchItem[]) {
  return [...matches].sort(
    (left, right) =>
      right.tournament.date.localeCompare(left.tournament.date) ||
      right.tournament.id.localeCompare(left.tournament.id) ||
      right.roundNumber - left.roundNumber ||
      right.tableNumber - left.tableNumber,
  );
}

export function groupPlayerMatchesByTournament(
  matches: PlayerMatchItem[],
): PlayerMatchGroup[] {
  const groups = new Map<
    string,
    {
      tournament: PlayerMatchItem['tournament'];
      matches: PlayerMatchItem[];
    }
  >();

  sortPlayerMatches(matches).forEach((match) => {
    const current = groups.get(match.tournament.id) ?? {
      tournament: match.tournament,
      matches: [],
    };

    current.matches.push(match);
    groups.set(match.tournament.id, current);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    record: getPlayerMatchRecord(group.matches),
  }));
}

function getRecordResultsCount(record: string) {
  const parts = record.trim().split('-').map(Number);

  if (
    (parts.length !== 2 && parts.length !== 3) ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    return null;
  }

  return parts.reduce((total, part) => total + part, 0);
}

function restoreOmittedByes(
  detail: PlayerDetailsResponse,
  matches: PlayerMatchItem[],
) {
  const matchesByTournament = new Map<string, PlayerMatchItem[]>();

  matches.forEach((match) => {
    const tournamentMatches =
      matchesByTournament.get(match.tournament.id) ?? [];

    tournamentMatches.push(match);
    matchesByTournament.set(match.tournament.id, tournamentMatches);
  });

  const inferredByes = detail.tournaments.flatMap<PlayerMatchItem>(
    (participation) => {
      const tournamentMatches =
        matchesByTournament.get(participation.tournament.id) ?? [];
      const expectedResultsCount = getRecordResultsCount(
        participation.record,
      );

      // Backend currently omits BYE from recentMatches. We only restore a BYE
      // when the event has other match rows and their round numbers leave an
      // unambiguous gap inside the final record. An entirely missing event is
      // not reconstructed because there is not enough evidence.
      if (
        tournamentMatches.length === 0 ||
        expectedResultsCount === null ||
        expectedResultsCount <= tournamentMatches.length
      ) {
        return [];
      }

      const occupiedRounds = new Set(
        tournamentMatches.map((match) => match.roundNumber),
      );
      const missingRounds = Array.from(
        { length: expectedResultsCount },
        (_, index) => index + 1,
      ).filter((roundNumber) => !occupiedRounds.has(roundNumber));

      if (
        missingRounds.length !==
        expectedResultsCount - tournamentMatches.length
      ) {
        return [];
      }

      return missingRounds.map<PlayerMatchItem>((roundNumber) => ({
        tournament: {
          id: participation.tournament.id,
          title: participation.tournament.title,
          date: participation.tournament.date,
          format: participation.tournament.format,
          type: participation.tournament.type,
          club: participation.tournament.club,
        },
        roundNumber,
        tableNumber: 0,
        playerDeck: participation.deck,
        playerScore: 2,
        opponentScore: 0,
        scoreText: 'BYE',
        result: 'win',
        isBye: true,
        kind: 'bye',
      }));
    },
  );

  return [...matches, ...inferredByes];
}

export function getPlayerMonthlyActivity(matches: PlayerMatchItem[]) {
  const monthly = new Map<
    string,
    Omit<PlayerMonthlyActivity, 'tournamentsCount' | 'winRate'> & {
      tournamentIds: Set<string>;
    }
  >();

  matches
    .filter((match) => getPlayerMatchKind(match) !== 'unknown')
    .forEach((match) => {
      const month = match.tournament.date.slice(0, 7);

      if (!month) {
        return;
      }

      const current = monthly.get(month) ?? {
        month,
        tournamentIds: new Set<string>(),
        matchesCount: 0,
        playedMatchesCount: 0,
        byesCount: 0,
        unknownResultsCount: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };

      const kind = getPlayerMatchKind(match);

      current.tournamentIds.add(match.tournament.id);
      current.matchesCount += 1;
      current.playedMatchesCount += kind === 'played' ? 1 : 0;
      current.byesCount += kind === 'bye' ? 1 : 0;
      current.wins += match.result === 'win' ? 1 : 0;
      current.losses += match.result === 'loss' ? 1 : 0;
      current.draws += match.result === 'draw' ? 1 : 0;
      monthly.set(month, current);
    });

  return [...monthly.values()]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map<PlayerMonthlyActivity>((item) => ({
      month: item.month,
      tournamentsCount: item.tournamentIds.size,
      matchesCount: item.matchesCount,
      playedMatchesCount: item.playedMatchesCount,
      byesCount: item.byesCount,
      unknownResultsCount: item.unknownResultsCount,
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      winRate:
        item.matchesCount > 0 ? (item.wins / item.matchesCount) * 100 : 0,
    }));
}

function getFavoriteDeck(matches: PlayerMatchItem[]) {
  const decks = new Map<
    string,
    {
      deck: NonNullable<PlayerMatchItem['playerDeck']>;
      matchesCount: number;
      tournamentsCount: number;
      tournamentIds: Set<string>;
    }
  >();

  matches
    .filter((match) => getPlayerMatchKind(match) !== 'unknown')
    .forEach((match) => {
    if (!match.playerDeck) {
      return;
    }

    const current = decks.get(match.playerDeck.id) ?? {
      deck: match.playerDeck,
      matchesCount: 0,
      tournamentsCount: 0,
      tournamentIds: new Set<string>(),
    };

    current.matchesCount += 1;
    current.tournamentIds.add(match.tournament.id);
    current.tournamentsCount = current.tournamentIds.size;
    decks.set(match.playerDeck.id, current);
    });

  return [...decks.values()].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      right.tournamentsCount - left.tournamentsCount ||
      compareNames(left.deck.name, right.deck.name),
  )[0] ?? null;
}

export function getPlayerScopedMatches(detail: PlayerDetailsResponse) {
  const tournamentIds = new Set(
    detail.tournaments.map((item) => item.tournament.id),
  );

  const scopedMatches = (detail.recentMatches ?? []).filter((match) =>
    tournamentIds.has(match.tournament.id),
  );

  return restoreOmittedByes(detail, scopedMatches);
}

function isMatchHistoryComplete(
  detail: PlayerDetailsResponse,
  matches = getPlayerScopedMatches(detail),
) {
  return getPlayerMatchRecord(matches).matchesCount === detail.summary.matchesCount;
}

export function getPlayerDetailInsights(
  detail: PlayerDetailsResponse,
  careerDetail?: PlayerDetailsResponse,
) {
  const matches = getPlayerScopedMatches(detail);
  const realMatchRecord = getPlayerMatchRecord(matches);
  const hasCompleteMatchHistory = isMatchHistoryComplete(detail, matches);
  const deckMatchesCount = detail.decks.reduce(
    (total, item) => total + item.matchesCount,
    0,
  );
  const isDeckHistoryComplete =
    deckMatchesCount === detail.summary.matchesCount;
  const isTournamentHistoryComplete =
    detail.tournaments.length === detail.summary.tournamentsCount;
  const excludedMatchesCount = Math.max(
    realMatchRecord.unknownResultsCount,
    detail.summary.unknownResultsCount ?? 0,
    detail.summary.matchesCount - realMatchRecord.matchesCount,
  );
  const favoriteDeck = getFavoriteDeck(matches);
  const opponentStats = getPlayerOpponentStats(matches);
  const careerMatches = careerDetail
    ? getPlayerScopedMatches(careerDetail)
    : [];

  return {
    isEstablished:
      realMatchRecord.matchesCount >= PLAYER_DETAIL_MIN_MATCHES &&
      detail.summary.tournamentsCount >= PLAYER_DETAIL_MIN_TOURNAMENTS,
    isMatchHistoryComplete: hasCompleteMatchHistory,
    isDeckHistoryComplete,
    isTournamentHistoryComplete,
    tournamentWinsCount: isTournamentHistoryComplete
      ? detail.tournaments.filter((item) => item.rank === 1).length
      : null,
    realMatchRecord,
    excludedMatchesCount,
    favoriteDeck,
    favoriteDeckShare:
      favoriteDeck && realMatchRecord.matchesCount > 0
        ? (favoriteDeck.matchesCount / realMatchRecord.matchesCount) * 100
        : null,
    favoriteFormat: careerDetail
      ? getPlayerFavoriteFormat(careerMatches)
      : null,
    mostFrequentOpponent:
      opponentStats?.mostFrequentOpponent ?? null,
    monthlyActivity: getPlayerMonthlyActivity(matches),
    firstTournament: isTournamentHistoryComplete
      ? [...detail.tournaments].sort((left, right) =>
          left.tournament.date.localeCompare(right.tournament.date),
        )[0] ?? null
      : null,
    latestTournament: isTournamentHistoryComplete
      ? [...detail.tournaments].sort((left, right) =>
          right.tournament.date.localeCompare(left.tournament.date),
        )[0] ?? null
      : null,
  };
}

export function isEstablishedPlayerDeck(item: PlayerDeckItem) {
  return (
    item.matchesCount >= PLAYER_DETAIL_MIN_MATCHES &&
    item.tournamentsCount >= PLAYER_DETAIL_MIN_TOURNAMENTS
  );
}
