import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  rules: [{ kind: 'min', label: 'Не менее 9 очков без поражений', threshold: 9, requireUndefeated: true, points: 3 }],
  tournaments: [{ id: '673', title: 'Standard Daily', date: '2026-09-01', playersCount: 20 }],
  standings: [{
    leagueRank: 1, rank: 1, player: { id: '25', name: 'Федулов Ринат' }, tournamentPoints: 9,
    bonusPoints: 3, rulePoints: 3, manualBonusPoints: 0, droppedTournamentPoints: 0,
    tournamentsPlayed: 1, tournamentsCounted: 1,
    breakdown: [{ kind: 'min', label: 'Не менее 9 очков без поражений', threshold: 9,
      requireUndefeated: true, timesApplied: 1, pointsPerTime: 3, points: 3 }],
    participations: [{ tournamentId: '673', tournamentTitle: 'Standard Daily', date: '2026-09-01',
      tournamentPoints: 9, rulePoints: 3, manualBonusPoints: 0, bonusReason: '', counted: true }],
  }],
};

function setup(initialEntry = '/leagues') {
  return render(<TestProviders initialEntry={initialEntry}><LeaguesPage /></TestProviders>);
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
    expect(screen.getByText('Не менее 9 очков без поражений')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('link', { name: 'Федулов Ринат' })).toHaveAttribute('href', '/players/25');
    expect(within(table).getByText('1 / 1')).toBeInTheDocument();
    await user.click(within(table).getByRole('button', { name: 'Подробнее' }));
    expect(within(table).getByText('1 × 3 = 3')).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Standard Daily' })).toHaveAttribute('href', '/tournaments/673');
    expect(within(table).getByText('В зачёте')).toBeInTheDocument();
  });

  it('uses league defaults, then asks the API to recalculate an edited server sort', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByRole('table');
    expect(getLeagueDetails).toHaveBeenCalledWith('1', ['tournamentPoints', 'bonusPoints', 'tournamentsPlayed'],
      { signal: expect.any(AbortSignal) });
    await user.click(screen.getByRole('button', { name: 'Изменить порядок' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Главный показатель' }), 'bonusPoints');
    await waitFor(() => expect(getLeagueDetails).toHaveBeenLastCalledWith('1', ['bonusPoints', 'tournamentsPlayed'],
      { signal: expect.any(AbortSignal) }));
  });

  it('passes league filters and clears a stale league selection', async () => {
    const user = userEvent.setup();
    setup('/leagues?cityId=moscow&clubId=portal&formatId=standard&leagueId=1');
    await screen.findByRole('table');
    expect(getLeagues).toHaveBeenCalledWith({ cityId: 'moscow', clubId: 'portal', formatId: 'standard' },
      { signal: expect.any(AbortSignal) });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Формат' }), '');
    await waitFor(() => expect(getLeagues).toHaveBeenLastCalledWith({ cityId: 'moscow', clubId: 'portal', formatId: undefined },
      { signal: expect.any(AbortSignal) }));
  });
});
