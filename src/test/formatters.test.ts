import { describe, expect, it } from 'vitest';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';

describe('format helpers', () => {
  it('formats percent with one decimal place', () => {
    expect(formatPercent(61.111)).toBe('61.1%');
  });

  it('formats record with draws when needed', () => {
    expect(formatRecord(7, 1, 1)).toBe('7-1-1');
    expect(formatRecord(4, 0, 0)).toBe('4-0');
  });

  it('formats ISO dates to Russian locale', () => {
    expect(formatDate('2026-07-08')).toBe('08.07.2026');
  });
});

