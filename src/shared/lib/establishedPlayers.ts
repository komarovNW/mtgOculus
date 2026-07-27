import type { TopPlayerItem } from '@/shared/api/types';

export const ESTABLISHED_PLAYER_MIN_MATCHES = 20;
export const ESTABLISHED_PLAYER_MIN_TOURNAMENTS = 5;

export function getEstablishedPlayers(items: TopPlayerItem[]) {
  return [...items]
    .filter(
      (item) =>
        item.matchesCount >= ESTABLISHED_PLAYER_MIN_MATCHES &&
        item.tournamentsCount >= ESTABLISHED_PLAYER_MIN_TOURNAMENTS,
    )
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount,
    );
}
