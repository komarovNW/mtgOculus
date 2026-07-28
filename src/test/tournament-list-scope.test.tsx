import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllTournaments, getTournaments } from '@/entities/tournament/api';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';

vi.mock('@/entities/tournament/api', () => ({
  getAllTournaments: vi.fn(),
  getTournaments: vi.fn(),
}));

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [] }),
  getClubs: vi.fn().mockResolvedValue({ items: [] }),
  getFormats: vi.fn().mockResolvedValue({ items: [] }),
}));

function renderPage(eventType: 'daily' | 'tournament', initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <TournamentsPage eventType={eventType} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('tournament list scope', () => {
  beforeEach(() => {
    vi.mocked(getAllTournaments).mockResolvedValue([]);
    vi.mocked(getTournaments).mockResolvedValue({
      appliedFilters: {},
      items: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    });
  });

  it('forces daily scope and hides the redundant type filter', async () => {
    vi.mocked(getTournaments).mockResolvedValueOnce({
      appliedFilters: {},
      items: [
        {
          id: 'daily-1',
          title: 'Daily 1',
          date: '2026-07-27',
          type: 'daily',
          city: { id: 'moscow', name: 'Москва' },
          club: { id: 'club', cityId: 'moscow', name: 'Клуб' },
          format: { id: 'legacy', name: 'Legacy' },
          playersCount: 8,
          roundsCount: 4,
          matchesCount: 16,
          winner: {
            player: { id: 'player-1', name: 'Игрок 1' },
            deck: { id: 'deck-1', name: 'Lands' },
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    });
    renderPage('daily', '/dailies?tournamentType=tournament');

    expect(screen.getByRole('heading', { level: 1, name: 'Дейлики' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Тип турнира')).not.toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'Победитель и колода' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Раундов/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Матчей/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lands' })).toBeInTheDocument();
    await waitFor(() => {
      expect(getTournaments).toHaveBeenCalledWith(
        expect.objectContaining({
          tournamentType: 'daily',
          page: 1,
          limit: 50,
        }),
      );
    });
  });

  it('forces tournament scope on the tournaments page', async () => {
    renderPage('tournament', '/tournaments?tournamentType=daily');

    expect(screen.getByRole('heading', { level: 1, name: 'Турниры' })).toBeInTheDocument();
    await waitFor(() => {
      expect(getTournaments).toHaveBeenCalledWith(
        expect.objectContaining({
          tournamentType: 'tournament',
        }),
      );
    });
  });
});
