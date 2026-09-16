import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DeckMetagameItem, DeckPerformanceItem } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';
import { DeckMetagameSection } from '@/widgets/deck-metagame/DeckMetagameSection';

const metagame: DeckMetagameItem[] = [
  { deck: { id: 'tempo', name: 'Tempo' }, playersCount: 12, tournamentsCount: 8, metaShare: 18.5 },
  { deck: { id: 'control', name: 'Control' }, playersCount: 7, tournamentsCount: 5, metaShare: 10.2 },
];

const performance: DeckPerformanceItem[] = [
  { deck: { id: 'tempo', name: 'Tempo' }, matchesCount: 40, playedMatchesCount: 40, byesCount: 0, matchWins: 24, matchLosses: 15,
    matchDraws: 1, matchWinRate: 60, isSmallSample: false },
];

describe('DeckMetagameSection', () => {
  it('joins overall deck win rate by ID and leaves missing performance honest', () => {
    render(
      <TestProviders>
        <DeckMetagameSection items={metagame} performanceItems={performance} />
      </TestProviders>,
    );

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('60.0%')).toBeInTheDocument();
    expect(within(rows[2]).getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Процент побед/ })).toBeInTheDocument();
  });
});
