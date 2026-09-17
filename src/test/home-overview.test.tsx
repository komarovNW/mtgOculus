import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HomeOverview as HomeOverviewData } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';
import { HomeOverview } from '@/widgets/home-overview/HomeOverview';

const overview: HomeOverviewData = {
  cities: [{
    city: { id: 'moscow', name: 'Москва' },
    clubsCount: 3,
    dailiesCount: 120,
    tournamentsCount: 4,
    uniquePlayersCount: 180,
    averagePlayersCount: 14.2,
    formatsCount: 4,
  }],
  clubs: [{
    club: { id: 'portal', name: 'Портал', cityId: 'moscow' },
    city: { id: 'moscow', name: 'Москва' },
    dailiesCount: 52,
    tournamentsCount: 2,
    uniquePlayersCount: 96,
    averagePlayersCount: 15.4,
    formatsCount: 3,
  }],
  formats: [{
    format: { id: 'legacy', name: 'Legacy' },
    dailiesCount: 80,
    tournamentsCount: 3,
    tournamentPlayersCount: 1120,
    uniquePlayersCount: 142,
    averagePlayersCount: 13.5,
    lastTournamentDate: '2026-09-16',
  }],
  cityFormats: [{
    city: { id: 'moscow', name: 'Москва' },
    leadingFormat: { id: 'legacy', name: 'Legacy' },
    participationShare: 44.5,
    otherFormats: [{ id: 'pauper', name: 'Pauper' }],
  }],
};

describe('HomeOverview', () => {
  it('shows server aggregates and links them to matching filters', () => {
    render(
      <TestProviders>
        <HomeOverview overview={overview} />
      </TestProviders>,
    );

    expect(screen.getByRole('heading', { name: 'Где играют' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Форматы' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Что играют в разных городах' })).toBeInTheDocument();

    const cityTable = screen.getByRole('region', { name: 'Статистика по городам' });
    expect(within(cityTable).getByRole('link', { name: 'Москва' }))
      .toHaveAttribute('href', '/?cityId=moscow');

    const clubTable = screen.getByRole('region', { name: 'Статистика по клубам' });
    expect(within(clubTable).getByRole('link', { name: 'Портал' }))
      .toHaveAttribute('href', '/?cityId=moscow&clubId=portal');

    const formatTable = screen.getByRole('region', { name: 'Общая статистика по форматам' });
    expect(within(formatTable).getByRole('link', { name: 'Legacy' }))
      .toHaveAttribute('href', '/?formatId=legacy');
    expect(within(formatTable).getByText('16.09.2026')).toBeInTheDocument();
  });
});
