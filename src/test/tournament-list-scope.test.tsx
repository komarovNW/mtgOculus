import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTournaments } from '@/entities/tournament/api';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';

vi.mock('@/entities/tournament/api', () => ({
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
    renderPage('daily', '/dailies?tournamentType=tournament');

    expect(screen.getByRole('heading', { level: 1, name: 'Дейлики' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Тип турнира')).not.toBeInTheDocument();
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
