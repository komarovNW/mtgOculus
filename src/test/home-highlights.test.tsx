import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  DeckMetagameItem,
  DeckPerformanceItem,
  PopularMatchupItem,
} from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';
import { HomeHighlights } from '@/widgets/home-highlights/HomeHighlights';

const smallDeck = {
  id: 'small',
  name: 'Small Sample',
};
const establishedDeck = {
  id: 'established',
  name: 'Established Deck',
};
const opponentDeck = {
  id: 'opponent',
  name: 'Frequent Opponent',
};

const deckMetagame: DeckMetagameItem[] = [
  {
    deck: smallDeck,
    playersCount: 4,
    tournamentsCount: 2,
    metaShare: 4,
  },
  {
    deck: establishedDeck,
    playersCount: 14,
    tournamentsCount: 12,
    metaShare: 3,
  },
];

const deckPerformance: DeckPerformanceItem[] = [
  {
    deck: smallDeck,
    matchesCount: 8,
    matchWins: 6,
    matchLosses: 2,
    matchDraws: 0,
    matchWinRate: 75,
    isSmallSample: false,
  },
  {
    deck: establishedDeck,
    matchesCount: 52,
    matchWins: 38,
    matchLosses: 14,
    matchDraws: 0,
    matchWinRate: 73.08,
    isSmallSample: false,
  },
];

const popularMatchups: PopularMatchupItem[] = [
  {
    deckA: establishedDeck,
    deckB: opponentDeck,
    matchesCount: 24,
    deckAWins: 15,
    deckBWins: 9,
    draws: 0,
    deckAWinRate: 62.5,
    isSmallSample: false,
  },
];

describe('HomeHighlights', () => {
  it('uses participation thresholds instead of raw win rate', () => {
    render(
      <TestProviders>
        <HomeHighlights
          deckMetagame={deckMetagame}
          deckPerformance={deckPerformance}
          popularMatchups={popularMatchups}
          recentTournaments={[]}
          summary={{
            tournamentsCount: 98,
            tournamentPlayersCount: 2555,
            uniquePlayersCount: 191,
            matchesCount: 4829,
            uniqueDecksCount: 283,
          }}
        />
      </TestProviders>,
    );

    expect(screen.getByText('Лучший результат на достаточной выборке'))
      .toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Established Deck' })).toHaveLength(2);
    expect(screen.queryByText('75.0%')).not.toBeInTheDocument();
    expect(screen.getByText('Самый частый матчап')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Frequent Opponent' })).toBeInTheDocument();
    expect(screen.queryByText('Лучший результат сейчас у')).not.toBeInTheDocument();
  });
});
