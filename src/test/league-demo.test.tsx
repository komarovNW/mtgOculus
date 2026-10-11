import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DemoLeaguePage } from '@/pages/leagues/demo/DemoLeaguePage';
import { createDemoLeague } from '@/pages/leagues/demo/data';
import { calculatePortalAutumnQualification } from '@/entities/league/lib/qualification';
import { TestProviders } from './test-utils';

afterEach(() => vi.unstubAllGlobals());

describe('league demo', () => {
  it('works without API calls and switches scenarios while keeping the selected view', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    render(<TestProviders><DemoLeaguePage /></TestProviders>);
    expect(screen.getByRole('heading', { name: 'Демо лиги' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Отбор в финал' }));
    expect(screen.getByRole('heading', { name: 'Очки лиги · 4 места' })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByRole('link')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Сценарий' }), 'november');
    expect(screen.getByRole('heading', { name: 'Очки лиги · 5 мест' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Сценарий' }), 'tie');
    expect(screen.getAllByText('Отбор пока не определён').length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('has all qualification paths and consistent per-tournament totals', () => {
    const league = calculatePortalAutumnQualification(createDemoLeague('september'));
    const groups = league.qualification!.groups;
    expect(groups.find((group) => group.key === 'league_points')?.entries).toHaveLength(4);
    expect(groups.find((group) => group.key === 'podval_points')?.entries).toHaveLength(3);
    expect(groups.find((group) => group.key === 'attendance')?.entries[0].player.name).toBe('Виктор Полянский');
    expect(league.standings.some((row) => row.qualification?.status === 'outside')).toBe(true);
    for (const row of league.standings) {
      expect(row.tournamentPoints).toBe(row.participations.reduce((sum, event) => sum + event.tournamentPoints, 0));
      expect(row.bonusPoints).toBe(row.breakdown.reduce((sum, rule) => sum + rule.points, 0));
      expect(row.tournamentsPlayed).toBe(row.participations.length);
    }
    const november = calculatePortalAutumnQualification(createDemoLeague('november'));
    expect(november.qualification!.groups.flatMap((group) => group.entries)).toHaveLength(16);
  });
});
