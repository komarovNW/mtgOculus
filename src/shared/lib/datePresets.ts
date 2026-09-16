import type { DashboardFilters } from '@/shared/api/types';

export const datePresetDays = [30, 90, 180, 365] as const;
export type DatePreset = (typeof datePresetDays)[number] | 'all';
export type DateRange = Pick<DashboardFilters, 'dateFrom' | 'dateTo'>;

function calendarDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getDatePresetRange(preset: DatePreset, today = new Date()): DateRange {
  if (preset === 'all') return { dateFrom: '', dateTo: '' };

  // Calendar days in the user's local time: avoid UTC shifts and 24-hour DST arithmetic.
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  start.setDate(start.getDate() - (preset - 1));
  return { dateFrom: calendarDate(start), dateTo: calendarDate(today) };
}

export function getActiveDatePreset(range: DateRange, today = new Date()): DatePreset | null {
  if (!range.dateFrom && !range.dateTo) return 'all';

  return datePresetDays.find((days) => {
    const preset = getDatePresetRange(days, today);
    return range.dateFrom === preset.dateFrom && range.dateTo === preset.dateTo;
  }) ?? null;
}
