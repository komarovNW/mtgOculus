import type { BackendMatchupMatrixResponse } from '@/shared/api/matchup-mappers';
import type { MatchupStats } from '@/shared/api/types';

export const matchupStats: MatchupStats = {
  matchesCount: 3, wins: 2, losses: 0, draws: 1, winRate: 66.67,
  winRateLow: 20.77, winRateHigh: 93.85, isSmallSample: true,
};

export function matchupResponse(): BackendMatchupMatrixResponse {
  const decks = [
    { id: 0, name: 'Tempo', colors: 'UB' },
    { id: 22, name: 'Forge', colors: null },
    { id: 30, name: 'Lands', colors: ['G'] },
  ];
  const noMatches = { matchesCount: 0, wins: 0, losses: 0, draws: 0, winRate: 0,
    winRateLow: null, winRateHigh: null, isSmallSample: true };
  return {
    decks,
    // Row order deliberately differs from column order.
    rows: [
      { deck: decks[1], metaShare: 4.26, mirrorMatches: 1,
        overall: { ...matchupStats, matchesCount: 80, wins: 40, losses: 38, draws: 2, winRate: 50, isSmallSample: false },
        cells: [{ ...matchupStats, wins: 0, losses: 2, winRate: 0 }, null, noMatches] },
      { deck: decks[2], metaShare: 2, mirrorMatches: 0, overall: noMatches, cells: [null, noMatches, null] },
      { deck: decks[0], metaShare: 4.9, mirrorMatches: 2,
        overall: { matchesCount: 100, wins: 55, losses: 40, draws: 5, winRate: 55, winRateLow: 45, winRateHigh: 65, isSmallSample: false },
        cells: [null, { ...matchupStats }, null] },
    ],
    appliedFilters: { city: { id: 'moscow', name: 'Москва' }, format: { id: 'legacy', name: 'Legacy' } },
  };
}
