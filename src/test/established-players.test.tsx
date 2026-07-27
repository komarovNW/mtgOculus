import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TopPlayerItem } from '@/shared/api/types';
import { getEstablishedPlayers } from '@/shared/lib/establishedPlayers';
import { TestProviders } from '@/test/test-utils';
import { TopPlayersTable } from '@/widgets/top-players/TopPlayersTable';

function player(
  id: string,
  tournamentsCount: number,
  matchesCount: number,
  matchWinRate: number,
): TopPlayerItem {
  const matchWins = Math.round((matchesCount * matchWinRate) / 100);

  return {
    player: { id, name: id },
    tournamentsCount,
    matchesCount,
    matchWins,
    matchLosses: matchesCount - matchWins,
    matchDraws: 0,
    matchWinRate,
    bestRank: 1,
    isSmallSample: false,
  };
}

describe('established player results', () => {
  it('excludes one-off results and ranks only established players', () => {
    const result = getEstablishedPlayers([
      player('one-match', 1, 1, 100),
      player('few-tournaments', 3, 30, 80),
      player('established', 15, 55, 74.55),
      player('established-lower', 30, 120, 65),
    ]);

    expect(result.map((item) => item.player.id)).toEqual([
      'established',
      'established-lower',
    ]);
  });

  it('does not show best place in the player spotlight or table', () => {
    render(
      <TestProviders>
        <TopPlayersTable
          items={[
            player('Player 1', 15, 55, 74.55),
            player('Player 2', 30, 120, 65),
            player('Player 3', 20, 80, 60),
            player('Player 4', 10, 40, 55),
          ]}
          showSpotlight
        />
      </TestProviders>,
    );

    expect(screen.queryByText(/Лучшее место|Лучший результат/)).not.toBeInTheDocument();
    expect(screen.getByText('20+ матчами минимум в 5 турнирах', { exact: false }))
      .toBeInTheDocument();
  });
});
