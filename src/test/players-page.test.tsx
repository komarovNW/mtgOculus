import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllPlayers, getPlayers } from '@/entities/player/api';
import { PlayersPage } from '@/pages/players/PlayersPage';
import type { PlayerListItem } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/player/api', () => ({
  getAllPlayers: vi.fn(),
  getPlayers: vi.fn(),
}));

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [] }),
  getClubs: vi.fn().mockResolvedValue({ items: [] }),
  getFormats: vi.fn().mockResolvedValue({ items: [] }),
}));

const activePlayer: PlayerListItem = {
  player: { id: 'active', name: 'Активный игрок' },
  tournamentsCount: 20,
  matchesCount: 80,
  matchWins: 48,
  matchLosses: 30,
  matchDraws: 2,
  matchWinRate: 60,
  bestRank: 1,
  isSmallSample: false,
};

const oneOffPlayer: PlayerListItem = {
  player: { id: 'one-off', name: 'Один матч' },
  tournamentsCount: 1,
  matchesCount: 1,
  matchWins: 1,
  matchLosses: 0,
  matchDraws: 0,
  matchWinRate: 100,
  bestRank: 1,
  isSmallSample: false,
};

describe('PlayersPage', () => {
  beforeEach(() => vi.clearAllMocks());
  it('defaults to activity and removes best-place sorting', async () => {
    vi.mocked(getPlayers).mockResolvedValue({
      appliedFilters: {},
      items: [activePlayer, oneOffPlayer],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    });
    vi.mocked(getAllPlayers).mockResolvedValue([activePlayer, oneOffPlayer]);

    render(
      <TestProviders initialEntry="/players">
        <PlayersPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(getPlayers).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'matchesCount',
          order: 'desc',
        }),
        { signal: expect.any(AbortSignal) },
      );
    });

    expect(await screen.findByRole('columnheader', { name: /Результатов/ }))
      .toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Лучшее место/ }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'По проценту побед' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'По лучшему месту' }))
      .not.toBeInTheDocument();
    expect(screen.getByText('Один матч').parentElement).toHaveTextContent('Малая выборка');
  });

  it('shows a focused empty state instead of zero-value analytics', async () => {
    vi.mocked(getPlayers).mockResolvedValue({
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
    vi.mocked(getAllPlayers).mockResolvedValue([]);

    render(
      <TestProviders initialEntry="/players?search=Несуществующий">
        <PlayersPage />
      </TestProviders>,
    );

    expect(
      await screen.findByText('Игроки по этому запросу не найдены'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Активность сообщества')).not.toBeInTheDocument();
    expect(screen.queryByText('Быстрый ориентир')).not.toBeInTheDocument();
  });

  it('requests only the completed search and does not show old rows under the new input', async () => {
    vi.mocked(getPlayers).mockResolvedValue({
      appliedFilters: {}, items: [activePlayer],
      pagination: { page: 1, limit: 50, total: 1, hasMore: false },
    });
    vi.mocked(getAllPlayers).mockResolvedValue([activePlayer]);
    render(<TestProviders initialEntry="/players"><PlayersPage /></TestProviders>);
    await screen.findByRole('heading', { name: 'Все игроки' });

    await userEvent.setup().type(screen.getByLabelText('Найти игрока'), 'Новый');
    expect(screen.queryByRole('heading', { name: 'Все игроки' })).not.toBeInTheDocument();
    expect(getPlayers).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(getPlayers).toHaveBeenCalledTimes(2));
    expect(getPlayers).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Новый', page: 1 }),
      { signal: expect.any(AbortSignal) },
    );
    expect(getAllPlayers).toHaveBeenCalledTimes(2);
  });
});
