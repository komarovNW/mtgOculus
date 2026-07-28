import type { TopPlayerItem } from '@/shared/api/types';

export const ESTABLISHED_PLAYER_MIN_MATCHES = 20;
export const ESTABLISHED_PLAYER_MIN_TOURNAMENTS = 5;
export const ESTABLISHED_PLAYER_SAMPLE_HINT =
  'Для устойчивого сравнения нужно минимум 20 матчей в 5 турнирах.';

export function isEstablishedPlayer(item: TopPlayerItem) {
  return (
    item.matchesCount >= ESTABLISHED_PLAYER_MIN_MATCHES &&
    item.tournamentsCount >= ESTABLISHED_PLAYER_MIN_TOURNAMENTS
  );
}

export function getEstablishedPlayers(items: TopPlayerItem[]) {
  return [...items]
    .filter(isEstablishedPlayer)
    .sort(
      (left, right) =>
        right.matchWinRate - left.matchWinRate ||
        right.matchesCount - left.matchesCount,
    );
}
