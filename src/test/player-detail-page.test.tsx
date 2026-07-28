import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getPlayerDetails } from '@/entities/player/api';
import { PlayerDetailPage } from '@/pages/player-detail/PlayerDetailPage';
import type { PlayerDetailsResponse } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/player/api', () => ({
  getPlayerDetails: vi.fn(),
}));

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [] }),
  getClubs: vi.fn().mockResolvedValue({ items: [] }),
  getFormats: vi.fn().mockResolvedValue({ items: [] }),
}));

const details: PlayerDetailsResponse = {
  appliedFilters: {
    city: { id: 'moscow', name: 'Москва' },
    format: { id: 'legacy', name: 'Legacy' },
  },
  player: { id: '3', name: 'Тестовый игрок' },
  summary: {
    tournamentsCount: 2,
    matchesCount: 3,
    matchWins: 2,
    matchLosses: 1,
    matchDraws: 0,
    matchWinRate: 66.67,
    bestRank: 1,
    averageRank: 2,
    uniqueDecksCount: 1,
    isSmallSample: false,
  },
  tournaments: [
    {
      tournament: {
        id: 'one',
        title: 'Первый турнир',
        date: '2026-01-10',
        type: 'daily',
        city: { id: 'moscow', name: 'Москва' },
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
        format: { id: 'legacy', name: 'Legacy' },
        playersCount: 20,
      },
      deck: { id: 'tempo', name: 'Tempo' },
      rank: 2,
      record: '1-1',
      points: 3,
    },
    {
      tournament: {
        id: 'two',
        title: 'Второй турнир',
        date: '2026-02-10',
        type: 'daily',
        city: { id: 'moscow', name: 'Москва' },
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
        format: { id: 'legacy', name: 'Legacy' },
        playersCount: 30,
      },
      deck: { id: 'tempo', name: 'Tempo' },
      rank: 1,
      record: '1-0',
      points: 3,
    },
  ],
  decks: [
    {
      deck: { id: 'tempo', name: 'Tempo' },
      tournamentsCount: 2,
      matchesCount: 3,
      matchWins: 2,
      matchLosses: 1,
      matchDraws: 0,
      matchWinRate: 66.67,
      bestRank: 1,
      isSmallSample: false,
    },
  ],
  recentMatches: [
    {
      tournament: {
        id: 'one',
        title: 'Первый турнир',
        date: '2026-01-10',
        format: { id: 'legacy', name: 'Legacy' },
        type: 'daily',
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
      },
      roundNumber: 1,
      tableNumber: 1,
      playerDeck: { id: 'tempo', name: 'Tempo' },
      opponent: { id: 'opponent', name: 'Частый оппонент' },
      opponentDeck: { id: 'control', name: 'Control' },
      playerScore: 0,
      opponentScore: 2,
      scoreText: '0-2',
      result: 'loss',
    },
    {
      tournament: {
        id: 'two',
        title: 'Второй турнир',
        date: '2026-02-10',
        format: { id: 'legacy', name: 'Legacy' },
        type: 'daily',
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
      },
      roundNumber: 1,
      tableNumber: 1,
      playerDeck: { id: 'tempo', name: 'Tempo' },
      opponent: { id: 'opponent', name: 'Частый оппонент' },
      opponentDeck: { id: 'control', name: 'Control' },
      playerScore: 2,
      opponentScore: 0,
      scoreText: '2-0',
      result: 'win',
    },
  ],
};

describe('PlayerDetailPage', () => {
  it('shows honest real-match statistics and simplified tables', async () => {
    vi.mocked(getPlayerDetails).mockResolvedValue(details);
    const user = userEvent.setup();

    render(
      <TestProviders initialEntry="/players/3">
        <Routes>
          <Route
            element={<PlayerDetailPage />}
            path="/players/:id"
          />
        </Routes>
      </TestProviders>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Тестовый игрок' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(getPlayerDetails).toHaveBeenCalledWith('3', {});
    });

    expect(screen.getByText('Результатов учтено')).toBeInTheDocument();
    expect(screen.getByText('Первых мест')).toBeInTheDocument();
    expect(screen.getByText('Включая 1 BYE')).toBeInTheDocument();
    expect(screen.getByText('Частый оппонент')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Динамика игрока' }))
      .toBeInTheDocument();
    expect(screen.queryByText('Лучшее место')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Очки' }))
      .not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Итог' }))
      .toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Колоды (1)' }));
    expect(screen.queryByRole('columnheader', { name: 'Лучшее место' }))
      .not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Оппоненты (1)' }));
    expect(screen.getByRole('heading', { name: 'Личные встречи' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Общих турниров' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Последняя встреча' }))
      .not.toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'История (3)' }));
    expect(screen.getByRole('heading', { name: 'История матчей' }))
      .toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader', { name: 'Оппонент' }),
    ).toHaveLength(2);
    expect(screen.getAllByText('Дейлик').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Клуб · Legacy/)).toHaveLength(2);
    expect(screen.getByText(/результат 1-0/)).toBeInTheDocument();
    expect(screen.getAllByText('BYE').length).toBeGreaterThanOrEqual(2);
  });
});
