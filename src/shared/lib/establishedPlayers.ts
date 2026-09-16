import type { TopPlayerItem } from '@/shared/api/types';

export const ESTABLISHED_PLAYER_SAMPLE_HINT =
  'Достаточность выборки определяет сервер по единому правилу статистики.';

export function isEstablishedPlayer(item: TopPlayerItem) {
  return !item.isSmallSample;
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
