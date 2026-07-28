import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAllDecks, getDecks } from '@/entities/deck/api';
import { DecksPage } from '@/pages/decks/DecksPage';
import type { DeckListItem } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/deck/api', () => ({
  getAllDecks: vi.fn(),
  getDecks: vi.fn(),
}));

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [] }),
  getClubs: vi.fn().mockResolvedValue({ items: [] }),
  getFormats: vi.fn().mockResolvedValue({ items: [] }),
}));

const establishedDeck: DeckListItem = {
  deck: { id: 'established', name: 'Популярная колода' },
  format: { id: 'legacy', name: 'Legacy' },
  tournamentsCount: 20,
  playersCount: 30,
  matchesCount: 80,
  matchWins: 48,
  matchLosses: 30,
  matchDraws: 2,
  matchWinRate: 60,
  bestRank: 1,
  isSmallSample: false,
};

const oneOffDeck: DeckListItem = {
  deck: { id: 'one-off', name: 'Одна игра' },
  format: { id: 'legacy', name: 'Legacy' },
  tournamentsCount: 1,
  playersCount: 1,
  matchesCount: 4,
  matchWins: 4,
  matchLosses: 0,
  matchDraws: 0,
  matchWinRate: 100,
  bestRank: 1,
  isSmallSample: false,
};

describe('DecksPage', () => {
  it('defaults to popularity and removes raw result sorting', async () => {
    vi.mocked(getDecks).mockResolvedValue({
      appliedFilters: {},
      items: [establishedDeck, oneOffDeck],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    });
    vi.mocked(getAllDecks).mockResolvedValue([establishedDeck, oneOffDeck]);

    render(
      <TestProviders initialEntry="/decks">
        <DecksPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(getDecks).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'playersCount_desc',
        }),
      );
    });

    expect(await screen.findAllByRole('columnheader', { name: /Матчей/ }))
      .not.toHaveLength(0);
    expect(screen.queryByRole('columnheader', { name: /Лучшее место/ }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'По проценту побед' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'По лучшему месту' }))
      .not.toBeInTheDocument();
    expect(screen.getByText('Одна игра').parentElement).toHaveTextContent('Малая выборка');

    const allDecksSection = screen.getByRole('heading', { name: 'Все колоды' })
      .closest('section');

    expect(allDecksSection).not.toBeNull();
    expect(
      within(allDecksSection as HTMLElement).queryByTitle(
        'Сортировать по колонке Процент побед',
      ),
    ).not.toBeInTheDocument();
  });

  it('filters deck search on the frontend when the backend returns an unfiltered list', async () => {
    vi.mocked(getDecks).mockResolvedValue({
      appliedFilters: {},
      items: [establishedDeck, oneOffDeck],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    });
    vi.mocked(getAllDecks).mockResolvedValue([establishedDeck, oneOffDeck]);

    render(
      <TestProviders initialEntry="/decks?search=одна">
        <DecksPage />
      </TestProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Результаты поиска' }))
      .toBeInTheDocument();

    const searchResults = screen.getByRole('heading', { name: 'Результаты поиска' })
      .closest('section');

    expect(searchResults).not.toBeNull();
    expect(searchResults).toHaveTextContent(
      'По запросу «одна» найдена 1 колода.',
    );
    expect(within(searchResults as HTMLElement).getByText('Одна игра'))
      .toBeInTheDocument();
    expect(within(searchResults as HTMLElement).queryByText('Популярная колода'))
      .not.toBeInTheDocument();
  });

  it('does not render zero-value analytics for an empty search', async () => {
    vi.mocked(getDecks).mockResolvedValue({
      appliedFilters: {},
      items: [establishedDeck, oneOffDeck],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    });
    vi.mocked(getAllDecks).mockResolvedValue([establishedDeck, oneOffDeck]);

    render(
      <TestProviders initialEntry="/decks?search=Несуществующая">
        <DecksPage />
      </TestProviders>,
    );

    expect(await screen.findByText('Колоды по этому запросу не найдены'))
      .toBeInTheDocument();
    expect(screen.queryByText('Структура метагейма')).not.toBeInTheDocument();
    expect(screen.queryByText('Быстрый ориентир')).not.toBeInTheDocument();
  });
});
