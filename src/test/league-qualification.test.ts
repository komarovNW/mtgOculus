import { describe, expect, it } from 'vitest';
import { calculatePortalAutumnQualification } from '@/entities/league/lib/qualification';
import type { LeagueDetails, LeagueStanding } from '@/shared/api/types';

function player(id: number) {
  return { id: String(id), name: `Тестовый игрок ${id}` };
}
function standing(id: number, overrides: Partial<LeagueStanding> = {}): LeagueStanding {
  return {
    player: player(id), leagueRank: id, rank: id, tournamentPoints: 100 - id,
    bonusPoints: 50 - id, tournamentsPlayed: id, tournamentsCounted: id,
    rulePoints: 50 - id, manualBonusPoints: 0, droppedTournamentPoints: 0,
    xZeroCount: 0, xOneCount: 0, zone: null, prequalifiedComment: null,
    breakdown: [], participations: [], ...overrides,
  };
}
function league(overrides: Partial<LeagueDetails> = {}): LeagueDetails {
  return {
    id: 'test', name: 'Осенняя лига', club: { id: 'portal', name: 'Портал', cityId: 'test' },
    format: { id: 'standard', name: 'Standard' }, dateStart: '2026-09-01', dateEnd: '2026-11-29',
    bestTournamentsCount: null, sort: ['tournamentPoints'], columns: [], cutoffs: {},
    rules: [], tournaments: [], prequalified: [],
    standings: Array.from({ length: 20 }, (_, index) => standing(index + 1)), ...overrides,
  };
}
function championship(ids: number[], comment: string) {
  return ids.map((id) => ({ player: player(id), leagueRank: null, comment }));
}
function groups(result: LeagueDetails) {
  return result.qualification!.groups;
}
function ids(result: LeagueDetails, key: string) {
  return groups(result).find((group) => group.key === key)!.entries.map((entry) => entry.player.id);
}

describe('Portal autumn final qualification', () => {
  it('allocates sixteen unique places in order and leaves original standings and statistics intact', () => {
    const input = league({ prequalified: [
      ...championship([1, 2, 3, 4], 'топ4 Store Champ 27.09'),
      ...championship([5, 6, 7, 8], 'топ4 Store Champ 22.11'),
    ] });
    const snapshot = structuredClone(input);
    const result = calculatePortalAutumnQualification(input);
    expect(ids(result, 'league_points')).toEqual(['9', '10', '11', '12']);
    expect(ids(result, 'podval_points')).toEqual(['13', '14', '15']);
    expect(ids(result, 'attendance')).toEqual(['20']);
    const allIds = groups(result).flatMap((group) => group.entries.map((entry) => entry.player.id));
    expect(allIds).toHaveLength(16);
    expect(new Set(allIds).size).toBe(16);
    expect(result.standings.find((row) => row.player.id === '16')?.qualification?.status).toBe('outside');
    expect(result.standings.find((row) => row.player.id === '20')?.qualification?.reason).toContain('Посещения');
    expect(input).toEqual(snapshot);
    expect(result.standings.map((row) => {
      const originalFields = { ...row };
      delete originalFields.qualification;
      return originalFields;
    })).toEqual(input.standings);
  });

  it('transfers overlapping Store slots to points but never counts mirrored records twice', () => {
    const result = calculatePortalAutumnQualification(league({
      prequalified: [
        ...championship([1, 2, 3, 4], 'топ4 Store Champ 27.09'),
        ...championship([1, 2, 5, 6], 'топ4 Store Champ 22.11'),
        ...championship([1], 'топ4 Store Champ 27.09'),
      ],
      standings: Array.from({ length: 20 }, (_, i) => standing(i + 1, i === 0
        ? { zone: 'prequalified', prequalifiedComment: 'топ4 Store Champ 27.09' } : {})),
    }));
    expect(ids(result, 'league_points')).toEqual(['7', '8', '9', '10', '11', '12']);
    expect(groups(result).reduce((sum, group) => sum + group.slots, 0)).toBe(16);
    expect(groups(result).flatMap((group) => group.entries)).toHaveLength(16);
  });

  it('recognizes both championships in one comment, including ISO dates', () => {
    const result = calculatePortalAutumnQualification(league({ prequalified: championship([1], 'топ4: 2026-09-27 и 2026-11-22') }));
    expect(groups(result).find((group) => group.key === 'league_points')?.slots).toBe(5);
  });

  it('reserves unreported Store slots and includes qualifiers with no dailies', () => {
    const result = calculatePortalAutumnQualification(league({ prequalified: championship([101, 102, 103, 104], 'Сентябрьский Store Championship') }));
    expect(groups(result).filter((group) => group.key.startsWith('store')).flatMap((group) => group.entries)).toHaveLength(4);
    expect(ids(result, 'league_points')).toHaveLength(4);
    expect(groups(result).flatMap((group) => group.entries)).toHaveLength(12);
    expect(result.standings).toHaveLength(20);
  });

  it('uses Podval Points and then X−1 / X−0−1, not name, attendance or supplied order, to break point ties', () => {
    const result = calculatePortalAutumnQualification(league({ standings: [
      standing(1), standing(2), standing(3),
      standing(4, { tournamentPoints: 80, bonusPoints: 5, xOneCount: 1, tournamentsPlayed: 100 }),
      standing(5, { tournamentPoints: 80, bonusPoints: 6, xOneCount: 0 }),
      standing(6, { tournamentPoints: 80, bonusPoints: 6, xOneCount: 2 }),
    ] }));
    expect(ids(result, 'league_points')).toEqual(['1', '2', '3', '6']);
    expect(result.standings.find((row) => row.player.id === '4')?.qualification?.paths[0].description).toContain('ниже по дополнительным');
  });

  it('does not arbitrarily award a boundary tie or silently distribute dependent slots', () => {
    const result = calculatePortalAutumnQualification(league({ standings: [
      standing(1), standing(2), standing(3),
      standing(4, { tournamentPoints: 80, bonusPoints: 10 }),
      standing(5, { tournamentPoints: 80, bonusPoints: 10 }),
      standing(6, { tournamentPoints: 70, bonusPoints: 5 }),
    ] }));
    expect(ids(result, 'league_points')).toEqual(['1', '2', '3']);
    expect(ids(result, 'podval_points')).toEqual([]);
    expect(result.standings.slice(3).every((row) => row.qualification?.status === 'unresolved')).toBe(true);
  });

  it('resolves tied players who all fit within a quota without blocking later categories', () => {
    const result = calculatePortalAutumnQualification(league({ standings: [
      standing(1), standing(2),
      standing(3, { tournamentPoints: 90, bonusPoints: 10 }),
      standing(4, { tournamentPoints: 90, bonusPoints: 10 }), standing(20),
    ] }));
    expect(ids(result, 'league_points')).toEqual(['1', '2', '3', '4']);
    expect(ids(result, 'podval_points')).toEqual(['20']);
  });

  it('breaks attendance ties by league points', () => {
    const rows = Array.from({ length: 9 }, (_, i) => standing(i + 1, { tournamentsPlayed: 10 }));
    const result = calculatePortalAutumnQualification(league({ standings: rows }));
    expect(ids(result, 'attendance')).toEqual(['8']);
    expect(result.standings[8].qualification?.status).toBe('outside');
  });

  it('breaks equal attendance and league points by Podval Points', () => {
    const rows = Array.from({ length: 9 }, (_, i) => standing(i + 1, {
      tournamentsPlayed: 10,
      ...(i >= 7 ? { tournamentPoints: 10 } : {}),
    }));
    const result = calculatePortalAutumnQualification(league({ standings: rows }));
    expect(ids(result, 'attendance')).toEqual(['8']);
  });

  it('leaves equal attendance, league points and Podval Points for the organizer', () => {
    const rows = Array.from({ length: 9 }, (_, i) => standing(i + 1, {
      tournamentsPlayed: 10,
      ...(i >= 7 ? { tournamentPoints: 10, bonusPoints: 1, xOneCount: i } : {}),
    }));
    const result = calculatePortalAutumnQualification(league({ standings: rows }));
    expect(ids(result, 'attendance')).toEqual([]);
    expect(result.standings.slice(7).every((row) => row.qualification?.status === 'unresolved')).toBe(true);
  });

  it('compares league points before X−1 / X−0−1 when Podval Points tie', () => {
    const rows = [standing(1), standing(2), standing(3), standing(4),
      standing(5, { tournamentPoints: 50, bonusPoints: 20 }),
      standing(6, { tournamentPoints: 40, bonusPoints: 15 }),
      standing(7, { tournamentPoints: 20, bonusPoints: 10, xOneCount: 0 }),
      standing(8, { tournamentPoints: 10, bonusPoints: 10, xOneCount: 99 }),
    ];
    const result = calculatePortalAutumnQualification(league({ standings: rows }));
    expect(ids(result, 'podval_points')).toEqual(['5', '6', '7']);
  });

  it('uses X−1 / X−0−1 after equal Podval Points and league points', () => {
    const rows = [standing(1), standing(2), standing(3), standing(4),
      standing(5, { tournamentPoints: 50, bonusPoints: 20 }),
      standing(6, { tournamentPoints: 40, bonusPoints: 15 }),
      standing(7, { tournamentPoints: 20, bonusPoints: 10, xOneCount: 0 }),
      standing(8, { tournamentPoints: 20, bonusPoints: 10, xOneCount: 1 }),
    ];
    expect(ids(calculatePortalAutumnQualification(league({ standings: rows })), 'podval_points')).toEqual(['5', '6', '8']);
  });

  it('does not apply this regulation to other leagues or replace a server calculation', () => {
    const other = league({ name: 'Весенняя лига' });
    expect(calculatePortalAutumnQualification(other)).toBe(other);
    const server = league({ qualification: { totalSlots: 8, groups: [] } });
    expect(calculatePortalAutumnQualification(server)).toBe(server);
  });
});
