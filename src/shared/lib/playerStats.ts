import type { Format, PlayerMatchItem, PlayerShort } from '@/shared/api/types';

export const OPPONENT_WIN_RATE_MIN_MATCHES = 5;

export type PlayerOpponentStat = {
  opponent: PlayerShort;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
};

export type PlayerOpponentStats = {
  mostFrequentOpponent: PlayerOpponentStat | null;
  bestWinRateOpponent: PlayerOpponentStat | null;
  worstWinRateOpponent: PlayerOpponentStat | null;
};

export type PlayerFavoriteFormat = {
  format: Format;
  matchesCount: number;
  tournamentsCount: number;
};

function compareOpponentName(left: PlayerOpponentStat, right: PlayerOpponentStat) {
  return (
    left.opponent.name.localeCompare(right.opponent.name, 'ru', { sensitivity: 'base' }) ||
    left.opponent.id.localeCompare(right.opponent.id)
  );
}

export function getPlayerOpponentStats(matches: PlayerMatchItem[]): PlayerOpponentStats {
  const opponents = new Map<string, PlayerOpponentStat>();

  matches.forEach((match) => {
    const current = opponents.get(match.opponent.id) ?? {
      opponent: match.opponent,
      matchesCount: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      matchWinRate: 0,
    };

    current.matchesCount += 1;
    current.matchWins += match.result === 'win' ? 1 : 0;
    current.matchLosses += match.result === 'loss' ? 1 : 0;
    current.matchDraws += match.result === 'draw' ? 1 : 0;
    current.matchWinRate = (current.matchWins / current.matchesCount) * 100;

    opponents.set(match.opponent.id, current);
  });

  const allOpponents = [...opponents.values()];
  const eligibleForWinRate = allOpponents.filter(
    (opponent) => opponent.matchesCount >= OPPONENT_WIN_RATE_MIN_MATCHES,
  );

  const mostFrequentOpponent =
    [...allOpponents].sort(
      (left, right) =>
        right.matchesCount - left.matchesCount ||
        right.matchWins - left.matchWins ||
        compareOpponentName(left, right),
    )[0] ?? null;
  const bestWinRateOpponent =
    [...eligibleForWinRate].sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount ||
        right.matchWins - left.matchWins ||
        compareOpponentName(left, right),
    )[0] ?? null;
  const worstWinRateOpponent =
    [...eligibleForWinRate].sort(
      (left, right) =>
        left.matchWinRate - right.matchWinRate ||
        right.matchesCount - left.matchesCount ||
        right.matchLosses - left.matchLosses ||
        compareOpponentName(left, right),
    )[0] ?? null;

  return {
    mostFrequentOpponent,
    bestWinRateOpponent,
    worstWinRateOpponent,
  };
}

export function getPlayerFavoriteFormat(matches: PlayerMatchItem[]): PlayerFavoriteFormat | null {
  const formats = new Map<
    string,
    PlayerFavoriteFormat & {
      tournamentIds: Set<string>;
    }
  >();

  matches.forEach((match) => {
    const { format } = match.tournament;
    const current = formats.get(format.id) ?? {
      format,
      matchesCount: 0,
      tournamentsCount: 0,
      tournamentIds: new Set<string>(),
    };

    current.matchesCount += 1;
    current.tournamentIds.add(match.tournament.id);
    current.tournamentsCount = current.tournamentIds.size;
    formats.set(format.id, current);
  });

  const favorite = [...formats.values()].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      right.tournamentsCount - left.tournamentsCount ||
      left.format.name.localeCompare(right.format.name, 'ru', { sensitivity: 'base' }) ||
      left.format.id.localeCompare(right.format.id),
  )[0];

  if (!favorite) {
    return null;
  }

  return {
    format: favorite.format,
    matchesCount: favorite.matchesCount,
    tournamentsCount: favorite.tournamentsCount,
  };
}
