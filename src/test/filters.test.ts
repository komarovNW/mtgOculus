import { describe, expect, it } from 'vitest';
import {
  defaultFilters,
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
});
