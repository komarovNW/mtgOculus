import type { TopPlayerItem } from '@/shared/api/types';

export type PlayerRatingItem = TopPlayerItem & {
  adjustedWinRate: number;
  rawWinRate: number;
};

export type PlayerRating = {
  fieldWinRate: number;
  minimumMatches: number;
  players: PlayerRatingItem[];
};

export const ESTABLISHED_PLAYER_SAMPLE_HINT =
  'Матчей пока мало, поэтому результат может заметно измениться.';

export function isEstablishedPlayer(item: TopPlayerItem) {
  return !item.isSmallSample;
}

export function getPlayerRatingMinimumMatches(items: TopPlayerItem[]) {
  const playersWithMatches = items.filter((item) => item.playedMatchesCount > 0);

  if (!playersWithMatches.length) {
    return 0;
  }

  const matchesTotal = playersWithMatches.reduce(
    (total, item) => total + item.playedMatchesCount,
    0,
  );

  return Math.ceil(matchesTotal / playersWithMatches.length);
}

export function getPlayerRating(items: TopPlayerItem[]): PlayerRating {
  const minimumMatches = getPlayerRatingMinimumMatches(items);
  const playersWithMatches = items.filter((item) => item.playedMatchesCount > 0);
  const matchesTotal = playersWithMatches.reduce(
    (total, item) => total + item.playedMatchesCount,
    0,
  );
  const weightedWinRateTotal = playersWithMatches.reduce(
    (total, item) => total + item.matchWinRate * item.playedMatchesCount,
    0,
  );
  const fieldWinRate = matchesTotal ? weightedWinRateTotal / matchesTotal : 0;

  if (minimumMatches === 0) {
    return { fieldWinRate, minimumMatches, players: [] };
  }

  const players = playersWithMatches
    .filter((item) => item.playedMatchesCount >= minimumMatches)
    .map<PlayerRatingItem>((item) => {
      const rawWinRate = item.matchWinRate;
      const adjustedWinRate =
        (item.playedMatchesCount / (item.playedMatchesCount + minimumMatches)) * rawWinRate +
        (minimumMatches / (item.playedMatchesCount + minimumMatches)) * fieldWinRate;

      return {
        ...item,
        adjustedWinRate,
        rawWinRate,
      };
    })
    .sort(
      (left, right) =>
        right.adjustedWinRate - left.adjustedWinRate ||
        right.playedMatchesCount - left.playedMatchesCount ||
        left.player.name.localeCompare(right.player.name, 'ru'),
    );

  return { fieldWinRate, minimumMatches, players };
}

export function getEstablishedPlayers(items: TopPlayerItem[]) {
  return getPlayerRating(items).players;
}
