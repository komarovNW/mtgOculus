import { describe, expect, it } from 'vitest';
import { getActiveDatePreset, getDatePresetRange } from '@/shared/lib/datePresets';

describe('calendar date presets', () => {
  const today = new Date(2026, 8, 6, 0, 30);

  it.each([
    [30, '2026-08-08'],
    [90, '2026-06-09'],
    [180, '2026-03-11'],
    [365, '2025-09-07'],
  ] as const)('includes exactly %i calendar days ending today', (days, start) => {
    expect(getDatePresetRange(days, today)).toEqual({ dateFrom: start, dateTo: '2026-09-06' });
  });

  it('uses calendar dates across leap years and year boundaries', () => {
    expect(getDatePresetRange(30, new Date(2024, 2, 1))).toEqual({ dateFrom: '2024-02-01', dateTo: '2024-03-01' });
    expect(getDatePresetRange(30, new Date(2025, 2, 1))).toEqual({ dateFrom: '2025-01-31', dateTo: '2025-03-01' });
    expect(getDatePresetRange(30, new Date(2026, 0, 1))).toEqual({ dateFrom: '2025-12-03', dateTo: '2026-01-01' });
  });

  it('recognizes presets only from both date bounds and treats open or past ranges as custom', () => {
    expect(getActiveDatePreset({ dateFrom: '', dateTo: '' }, today)).toBe('all');
    expect(getActiveDatePreset({ dateFrom: '2026-08-08', dateTo: '2026-09-06' }, today)).toBe(30);
    expect(getActiveDatePreset({ dateFrom: '2026-08-08', dateTo: '' }, today)).toBeNull();
    expect(getActiveDatePreset({ dateFrom: '', dateTo: '2026-09-06' }, today)).toBeNull();
    expect(getActiveDatePreset({ dateFrom: '2026-08-07', dateTo: '2026-09-05' }, today)).toBeNull();
    expect(getDatePresetRange('all', today)).toEqual({ dateFrom: '', dateTo: '' });
  });
});
