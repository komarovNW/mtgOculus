import { render, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getDeckDetails } from '@/entities/deck/api';
import { DeckDetailPage } from '@/pages/deck-detail/DeckDetailPage';
import type { DeckDetailsResponse } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/deck/api', () => ({
  getDeckDetails: vi.fn(),
}));

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [] }),
  getClubs: vi.fn().mockResolvedValue({ items: [] }),
  getFormats: vi.fn().mockResolvedValue({ items: [] }),
}));

const detail: DeckDetailsResponse = {
  deck: {
    id: '5',
    name: 'UB tempo',
    format: { id: 'legacy', name: 'Legacy' },
  },
  appliedFilters: {
    city: { id: 'moscow', name: 'Москва' },
  },
  summary: {
    tournamentsCount: 10,
    playersCount: 2,
    uniquePlayersCount: 1,
    metaShare: 20,
    matchesCount: 30,
    playedMatchesCount: 30,
    byesCount: 0,
    matchWins: 18,
    matchLosses: 12,
    matchDraws: 0,
    matchWinRate: 60,
    bestRank: 1,
    isSmallSample: true,
  },
  tournamentResults: [
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
      player: { id: 'player', name: 'Игрок' },
      rank: 2,
      record: '9-6',
      points: 27,
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
      player: { id: 'player', name: 'Игрок' },
      rank: 3,
      record: '9-6',
      points: 27,
    },
  ],
  players: [
    {
      player: { id: 'player', name: 'Игрок' },
      tournamentsCount: 10,
      matchesCount: 30,
      playedMatchesCount: 30,
      byesCount: 0,
      matchWins: 18,
      matchLosses: 12,
      matchDraws: 0,
      matchWinRate: 60,
      bestRank: 1,
      isSmallSample: true,
    },
  ],
  matchups: [
    {
      opponentDeck: { id: 'good', name: 'Хороший матчап' },
      matchesCount: 18,
      wins: 13,
      losses: 5,
      draws: 0,
      winRate: 72.22,
      isSmallSample: false,
    },
    {
      opponentDeck: { id: 'bad', name: 'Плохой матчап' },
      matchesCount: 12,
      wins: 5,
      losses: 7,
      draws: 0,
      winRate: 41.67,
      isSmallSample: false,
    },
  ],
};

describe('DeckDetailPage', () => {
  it('shows reliable deck insights and removes weak aggregate fields', async () => {
    vi.mocked(getDeckDetails).mockResolvedValue(detail);

    render(
      <TestProviders initialEntry="/decks/5?formatId=modern">
        <Routes>
          <Route
            element={<DeckDetailPage />}
            path="/decks/:id"
          />
        </Routes>
      </TestProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'UB tempo' }))
      .toBeInTheDocument();

    await waitFor(() => {
      expect(getDeckDetails).toHaveBeenCalledWith(
        '5',
        expect.objectContaining({ formatId: undefined }),
        { signal: expect.any(AbortSignal) },
      );
    });

    expect(await screen.findByText('20.0%')).toBeInTheDocument();
    expect(screen.getAllByText('Хороший матчап')).toHaveLength(2);
    expect(screen.getAllByText('Плохой матчап')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Матчапы колоды' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Активность по месяцам' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Главное об игроках' }))
      .toBeInTheDocument();
    expect(screen.getByText('Чаще всего играл')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Изменить фильтры' })).toBeInTheDocument();
    expect(screen.queryByText('Лучшее место')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Очки' }))
      .not.toBeInTheDocument();
    expect(screen.queryByLabelText('Формат')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Доля матчей' }))
      .not.toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });

  it('uses event-specific labels for daily results', async () => {
    vi.mocked(getDeckDetails).mockResolvedValue(detail);

    render(
      <TestProviders initialEntry="/decks/5?tournamentType=daily">
        <Routes>
          <Route element={<DeckDetailPage />} path="/decks/:id" />
        </Routes>
      </TestProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'UB tempo' }))
      .toBeInTheDocument();
    expect(screen.getByText('Участий в дейликах')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Дейлики (2)' })).toBeInTheDocument();
  });
});
