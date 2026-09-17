import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TopPlayerItem } from '@/shared/api/types';
import {
  getEstablishedPlayers,
  getPlayerRating,
  getPlayerRatingMinimumMatches,
} from '@/shared/lib/establishedPlayers';
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
    playedMatchesCount: matchesCount,
    byesCount: 0,
    matchWins,
    matchLosses: matchesCount - matchWins,
    matchDraws: 0,
    playedWins: matchWins,
    matchWinRate,
    bestRank: 1,
    isSmallSample: id === 'one-match' || id === 'few-tournaments',
  };
}

describe('established player results', () => {
  it('excludes one-off results and ranks only established players', () => {
    const result = getEstablishedPlayers([
      player('one-match', 1, 1, 100),
      player('few-tournaments', 3, 30, 80),
      player('short-hot-streak', 2, 7, 100),
      player('established', 15, 55, 74.55),
      player('established-lower', 30, 120, 65),
    ]);

    expect(result.map((item) => item.player.id)).toEqual([
      'established',
      'established-lower',
    ]);
  });

  it('uses the average number of played matches as an adaptive cutoff', () => {
    const items = [
      player('short-run', 2, 4, 100),
      player('average-run', 3, 5, 70),
      player('long-run', 4, 6, 65),
    ];

    expect(getPlayerRatingMinimumMatches(items)).toBe(5);
    expect(getEstablishedPlayers(items).map((item) => item.player.id)).toEqual([
      'average-run',
      'long-run',
    ]);
  });

  it('uses the raw win rate returned by the backend', () => {
    const item = player('draw-player', 4, 10, 75);
    item.playedWins = 6;
    item.matchWins = 6;
    item.matchLosses = 2;
    item.matchDraws = 2;

    const rating = getPlayerRating([item]);

    expect(rating.players[0].rawWinRate).toBe(75);
  });

  it('excludes a short result and adjusts an eligible result towards the field average', () => {
    const short = player('short', 5, 10, 80);
    const long = player('long', 20, 30, 70);
    const baseline = player('baseline', 10, 20, 50);
    const rating = getPlayerRating([short, long, baseline]);

    const shortRating = rating.players.find((item) => item.player.id === 'short');
    const longRating = rating.players.find((item) => item.player.id === 'long');

    expect(rating.minimumMatches).toBe(20);
    expect(shortRating).toBeUndefined();
    expect(longRating?.adjustedWinRate).toBeLessThan(longRating?.rawWinRate ?? 0);
    expect(longRating?.adjustedWinRate).toBeGreaterThan(rating.fieldWinRate);
  });

  it('does not show best place in the player spotlight or table', () => {
    const rating = getPlayerRating([
      player('Player 1', 15, 55, 74.55),
      player('Player 2', 30, 120, 65),
      player('Player 3', 20, 80, 60),
      player('Player 4', 10, 40, 55),
    ]);

    render(
      <TestProviders>
        <TopPlayersTable
          fieldWinRate={rating.fieldWinRate}
          items={rating.players}
          minimumMatches={rating.minimumMatches}
          showSpotlight
        />
      </TestProviders>,
    );

    expect(screen.queryByText(/Лучшее место|Лучший результат/)).not.toBeInTheDocument();
    expect(screen.getByText('Учитываем процент побед и количество матчей', { exact: false }))
      .toBeInTheDocument();
    expect(screen.getByText('Как считается рейтинг')).toBeInTheDocument();
  });
});
