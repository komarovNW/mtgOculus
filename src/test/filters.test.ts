import { describe, expect, it } from 'vitest';
import {
  defaultFilters,
  emptyFilters,
  getDashboardFilterSearch,
  readDashboardFilters,
  toApiFilters,
  writeDashboardFilters,
} from '@/shared/lib/filters';

describe('dashboard filters', () => {
  it('uses Moscow and Legacy when filters are absent', () => {
    expect(readDashboardFilters(new URLSearchParams())).toMatchObject({
      cityId: 'moscow',
      formatId: 'legacy',
    });
  });

  it('preserves explicitly selected all cities and all formats', () => {
    const params = writeDashboardFilters(new URLSearchParams(), {
      ...defaultFilters,
      cityId: '',
      formatId: '',
    });
    const filters = readDashboardFilters(params);

    expect(params.has('cityId')).toBe(true);
    expect(params.has('formatId')).toBe(true);
    expect(filters.cityId).toBe('');
    expect(filters.formatId).toBe('');
    expect(toApiFilters(filters).cityId).toBeUndefined();
    expect(toApiFilters(filters).formatId).toBeUndefined();
  });

  it('keeps dashboard filters but removes page-specific query parameters', () => {
    expect(
      getDashboardFilterSearch('?cityId=spb&formatId=&tournamentType=daily&page=3&sort=name'),
    ).toBe('?cityId=spb&formatId=&tournamentType=daily');
  });

  it('clears every API filter when reset values are written', () => {
    const params = writeDashboardFilters(
      new URLSearchParams('?cityId=moscow&clubId=club&formatId=legacy&tournamentType=daily&dateFrom=2026-01-01'),
      emptyFilters,
    );
    const filters = readDashboardFilters(params);

    expect(filters).toEqual(emptyFilters);
    expect(toApiFilters(filters)).toEqual({
      cityId: undefined,
      clubId: undefined,
      formatId: undefined,
      tournamentType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  });
});
