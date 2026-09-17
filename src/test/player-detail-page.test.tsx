import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    undefeatedTopsCount: 1,
    matchesCount: 3,
    playedMatchesCount: 2,
    byesCount: 1,
    matchWins: 2,
    matchLosses: 1,
    matchDraws: 0,
    playedWins: 1,
    matchWinRate: 50,
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
      record: '2-0',
      points: 6,
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
      record: '1-0-1',
      points: 4,
    },
  ],
  decks: [
    {
      deck: { id: 'tempo', name: 'Tempo' },
      tournamentsCount: 2,
      matchesCount: 3,
      playedMatchesCount: 2,
      byesCount: 1,
      matchWins: 2,
      matchLosses: 1,
      matchDraws: 0,
      playedWins: 1,
      matchWinRate: 50,
      bestRank: 1,
      isSmallSample: false,
    },
  ],
  recentMatches: [
    {
      tournament: {
        id: 'one', title: 'Первый турнир', date: '2026-01-10',
        format: { id: 'legacy', name: 'Legacy' }, type: 'daily',
        club: { id: 'club', name: 'Клуб', cityId: 'moscow' },
      },
      roundNumber: 2,
      tableNumber: 0,
      playerDeck: { id: 'tempo', name: 'Tempo' },
      playerScore: 2,
      opponentScore: 0,
      scoreText: 'BYE',
      result: 'win',
      isBye: true,
    },
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows honest real-match statistics and simplified tables', async () => {
    vi.mocked(getPlayerDetails).mockResolvedValue(details);
    const user = userEvent.setup();

    render(
      <TestProviders initialEntry="/players/3?tournamentType=daily">
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
      expect(getPlayerDetails).toHaveBeenCalledWith(
        '3',
        expect.objectContaining({ cityId: 'moscow', formatId: 'legacy' }),
        { signal: expect.any(AbortSignal) },
      );
    });
    expect(getPlayerDetails).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Сыграно матчей')).toBeInTheDocument();
    expect(screen.getByText('Дейликов')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Дейлики (2)' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Дейлик' })).toBeInTheDocument();
    expect(screen.getByText('Топов без поражений')).toBeInTheDocument();
    expect(screen.getByText('Все раунды сыграны и выиграны')).toBeInTheDocument();
    expect(screen.getByText('Ещё 1 BYE показано отдельно')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Изменить фильтры' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Активность по месяцам' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Главное о колодах' }))
      .toBeInTheDocument();
    expect(screen.getByText('Любимая колода')).toBeInTheDocument();
    expect(screen.queryByText('Лучшее место')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Очки' }))
      .not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Итог' }))
      .toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Колоды (1)' }));
    expect(screen.queryByRole('columnheader', { name: 'Лучшее место' }))
      .not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать' }));
    expect(screen.getByRole('heading', { name: 'Матчапы на Tempo' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Колода соперника' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Control' })).toHaveAttribute(
      'href',
      '/decks/control?tournamentType=daily',
    );
    expect(screen.getAllByText('1-1')).not.toHaveLength(0);
    expect(screen.getAllByText('50.0%')).not.toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Скрыть' }));
    expect(screen.queryByRole('heading', { name: 'Матчапы на Tempo' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Оппоненты (1)' }));
    expect(screen.getByRole('heading', { name: 'Личные встречи' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Общих турниров' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Последняя встреча' }))
      .not.toBeInTheDocument();
    expect(screen.getAllByText('50.0%')).not.toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'История (3)' }));
    expect(screen.queryByRole('heading', { name: 'История матчей' }))
      .not.toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader', { name: 'Оппонент' }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole('columnheader', { name: 'Колода игрока' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/Колода:/)).toHaveLength(2);
    expect(screen.getAllByText('Дейлик').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Клуб · Legacy/)).toHaveLength(2);
    expect(screen.getByText(/результат 1-0/)).toBeInTheDocument();
    expect(screen.getAllByText('BYE').length).toBeGreaterThanOrEqual(2);
  });
});
