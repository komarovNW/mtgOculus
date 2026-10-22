import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLeagueDetails, getLeagues } from '@/entities/league/api';
import { LeaguesPage } from '@/pages/leagues/LeaguesPage';
import type { LeagueDetails, LeagueListResponse } from '@/shared/api/types';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/league/api', () => ({ getLeagues: vi.fn(), getLeagueDetails: vi.fn() }));
vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({ items: [{ id: 'moscow', name: 'Москва' }] }),
  getClubs: vi.fn().mockResolvedValue({ items: [{ id: 'portal', name: 'Портал', cityId: 'moscow' }] }),
  getFormats: vi.fn().mockResolvedValue({ items: [{ id: 'standard', name: 'Standard' }] }),
}));

const listResponse: LeagueListResponse = {
  items: [{
    id: '1', name: 'Осенняя лига 2026', club: { id: 'portal', name: 'Портал', cityId: 'moscow' },
    format: { id: 'standard', name: 'Standard' }, dateStart: '2026-09-01', dateEnd: '2026-11-30',
    bestTournamentsCount: null, sort: ['tournamentPoints', 'bonusPoints', 'tournamentsPlayed'],
    tournamentsCount: 1, playersCount: 1,
  }],
  pagination: { page: 1, limit: 100, total: 1, hasMore: false },
  appliedFilters: {},
};

const details: LeagueDetails = {
  ...listResponse.items[0],
  columns: [
    { position: 1, key: 'tournamentPoints', label: 'Турнирные очки' },
    { position: 2, key: 'xZeroCount', label: 'Все матчи выиграны' },
  ],
  qualification: [
    {
      title: 'Ручной отбор',
      slots: 2,
      seats: [
        { player: null, comment: 'Лучший игрок котиками' },
        { player: { id: '7', name: 'Иванов Иван' }, comment: 'Победитель весенней лиги' },
      ],
    },
    {
      title: 'Сентябрьский Store Championship',
      slots: 2,
      seats: [
        { player: { id: '5', name: 'Эрлангер Александр' }, comment: null },
        { player: { id: '25', name: 'Федулов Ринат' }, comment: 'Топ-2 Store Championship' },
      ],
    },
  ],
  rules: [{ kind: 'min', label: 'Не менее 9 очков без поражений', threshold: 9, requireUndefeated: true, points: 3 }],
  tournaments: [{ id: '673', title: 'Standard Daily', date: '2026-09-01', playersCount: 20 }],
  standings: [{
    leagueRank: 1, rank: 1, player: { id: '25', name: 'Федулов Ринат' }, tournamentPoints: 9,
    bonusPoints: 3, rulePoints: 3, manualBonusPoints: 0, droppedTournamentPoints: 0,
    tournamentsPlayed: 1, tournamentsCounted: 1, xZeroCount: 1, xOneCount: 0,
    breakdown: [{ kind: 'min', label: 'Не менее 9 очков без поражений', threshold: 9,
      requireUndefeated: true, timesApplied: 1, pointsPerTime: 3, points: 3 }],
    participations: [{ tournamentId: '673', tournamentTitle: 'Standard Daily', date: '2026-09-01',
      tournamentPoints: 9, rulePoints: 3, manualBonusPoints: 0, bonusReason: '', counted: true }],
  }],
};

function setup(initialEntry = '/leagues') {
  return render(
    <TestProviders initialEntry={initialEntry}>
      <Routes>
        <Route element={<LeaguesPage />} path="/leagues" />
        <Route element={<LeaguesPage />} path="/leagues/:id" />
      </Routes>
    </TestProviders>,
  );
}

describe('LeaguesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLeagues).mockResolvedValue(listResponse);
    vi.mocked(getLeagueDetails).mockResolvedValue(details);
  });

  it('shows league rules, standings and expandable player details', async () => {
    const user = userEvent.setup();
    setup();
    expect(await screen.findByRole('heading', { name: 'Осенняя лига 2026' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Лига' })).toHaveValue('1');
    expect(screen.queryByRole('combobox', { name: 'Город' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Клуб' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Формат' })).not.toBeInTheDocument();
    expect(screen.getByText('Не менее 9 очков без поражений')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Место' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Турнирные очки' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Все матчи выиграны' })).toBeInTheDocument();
    expect(within(table).queryByRole('columnheader', { name: 'Бонусные очки' })).not.toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Федулов Ринат' })).toHaveAttribute('href', '/players/25');
    expect(screen.queryByRole('heading', { name: /Отбор в финал/ })).not.toBeInTheDocument();
    expect(screen.getByText('Прошли')).toBeInTheDocument();
    expect(within(table).getByText('Прошёл')).toBeInTheDocument();
    expect(within(table).getByText('Топ-2 Store Championship')).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Федулов Ринат' }).closest('tr'))
      .toHaveClass('league-table__row--qualified');
    expect(screen.queryByText(/Проходная зона/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Резервная зона/)).not.toBeInTheDocument();
    await user.click(within(table).getByRole('button', { name: 'Подробнее' }));
    expect(within(table).getByText('1 × 3 = 3')).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Standard Daily' })).toHaveAttribute('href', '/tournaments/673');
    expect(within(table).getByText('В зачёте')).toBeInTheDocument();
  });

  it('keeps qualification details out of a separate block', async () => {
    setup('/leagues/1');

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ручной отбор' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Победитель весенней лиги/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Лучший игрок котиками/)).not.toBeInTheDocument();
    expect(screen.queryByText('TBA')).not.toBeInTheDocument();
  });

  it('highlights the next four players and four reserves after qualified players', async () => {
    const baseStanding = details.standings[0];
    vi.mocked(getLeagueDetails).mockResolvedValue({
      ...details,
      standings: [
        baseStanding,
        ...Array.from({ length: 8 }, (_, index) => ({
          ...baseStanding,
          leagueRank: index + 2,
          rank: index + 2,
          player: { id: `candidate-${index + 1}`, name: `Кандидат ${index + 1}` },
        })),
      ],
    });

    setup('/leagues/1');

    const table = await screen.findByRole('table');
    expect(screen.getByText('Проходная зона')).toBeInTheDocument();
    expect(screen.getByText('Резервная зона')).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Кандидат 1' }).closest('tr'))
      .toHaveClass('league-table__row--qualify');
    expect(within(table).getByRole('link', { name: 'Кандидат 5' }).closest('tr'))
      .toHaveClass('league-table__row--reserve');
  });

  it('uses the official league order without client-side sorting controls', async () => {
    setup('/leagues/1');
    await screen.findByRole('table');
    expect(getLeagueDetails).toHaveBeenCalledWith('1', [],
      { signal: expect.any(AbortSignal) });
    expect(screen.queryByRole('button', { name: 'Изменить порядок' })).not.toBeInTheDocument();
    expect(screen.getByText('Игроки расположены в официальном порядке лиги.')).toBeInTheDocument();
  });

  it('loads all leagues without applying stale dashboard filters', async () => {
    setup('/leagues?cityId=moscow&clubId=portal&formatId=standard&leagueId=1');
    await screen.findByRole('table');
    expect(getLeagues).toHaveBeenCalledWith({}, { signal: expect.any(AbortSignal) });
    expect(screen.getByRole('combobox', { name: 'Лига' })).toHaveValue('1');
  });

  it('does not replace an unknown personal league URL with another league', async () => {
    setup('/leagues/999');

    expect(await screen.findByRole('heading', { name: 'Лига не найдена' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Осенняя лига 2026' })).not.toBeInTheDocument();
    expect(getLeagueDetails).not.toHaveBeenCalled();
  });
});
