import type { AppliedFilters } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/formatDate';

export function getAppliedFilterLabels(filters?: AppliedFilters) {
  if (!filters) {
    return [];
  }

  const labels: string[] = [];

  if (filters.city?.name) {
    labels.push(filters.city.name);
  }

  if (filters.club?.name) {
    labels.push(filters.club.name);
  }

  if (filters.format?.name) {
    labels.push(filters.format.name);
  }

  if (filters.tournamentType) {
    labels.push(filters.tournamentType === 'daily' ? 'Дейлик' : 'Турнир');
  }

  if (filters.dateFrom || filters.dateTo) {
    labels.push(
      `Период: ${filters.dateFrom ? formatDate(filters.dateFrom) : '—'} - ${
        filters.dateTo ? formatDate(filters.dateTo) : '—'
      }`,
    );
  }

  return labels;
}

