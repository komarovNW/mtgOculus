import { useQuery } from '@tanstack/react-query';
import { getCities, getClubs, getFormats } from '@/entities/dictionaries/api';
import type { DashboardFilters } from '@/shared/api/types';
import { defaultFilters } from '@/shared/lib/filters';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';

type FiltersPanelProps = {
  filters: DashboardFilters;
  onChange: (values: Partial<DashboardFilters>) => void;
  onReset: () => void;
};

export function FiltersPanel({ filters, onChange, onReset }: FiltersPanelProps) {
  const citiesQuery = useQuery({
    queryKey: ['dictionaries', 'cities'],
    queryFn: getCities,
  });
  const formatsQuery = useQuery({
    queryKey: ['dictionaries', 'formats'],
    queryFn: getFormats,
  });
  const clubsQuery = useQuery({
    queryKey: ['dictionaries', 'clubs', filters.cityId],
    queryFn: () => getClubs(filters.cityId),
    enabled: Boolean(filters.cityId),
  });

  const cityOptions = [
    { value: '', label: citiesQuery.isLoading ? 'Загружаем города...' : 'Все города' },
    ...(citiesQuery.data?.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const clubOptions = [
    { value: '', label: clubsQuery.isLoading ? 'Загружаем клубы...' : 'Все клубы' },
    ...(clubsQuery.data?.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const formatOptions = [
    { value: '', label: formatsQuery.isLoading ? 'Загружаем форматы...' : 'Все форматы' },
    ...(formatsQuery.data?.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const tournamentTypeOptions = [
    { value: '', label: 'Все типы' },
    { value: 'daily', label: 'Дейлик' },
    { value: 'tournament', label: 'Турнир' },
  ];

  const activeExtraFiltersCount = [
    filters.clubId !== defaultFilters.clubId,
    filters.tournamentType !== defaultFilters.tournamentType,
    filters.dateFrom !== defaultFilters.dateFrom,
    filters.dateTo !== defaultFilters.dateTo,
    filters.cityId !== defaultFilters.cityId,
    filters.formatId !== defaultFilters.formatId,
  ].filter(Boolean).length;

  return (
    <Card className="filters-panel">
      <div className="section-header">
        <div>
          <div className="section-header__title-row">
            <h2 className="section-header__title">Фильтры</h2>
            <Badge>{activeExtraFiltersCount > 0 ? `Активно: ${activeExtraFiltersCount}` : 'Базовый срез'}</Badge>
          </div>
          <p className="section-header__description">
            Эти фильтры влияют на все блоки ниже. Выберите город, клуб, формат и даты, чтобы посмотреть нужную статистику.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onReset}
          type="button"
        >
          Сбросить
        </Button>
      </div>

      <div className="filters-grid">
        <Select
          label="Город"
          onChange={(event) => onChange({ cityId: event.target.value, clubId: '' })}
          options={cityOptions}
          value={filters.cityId}
        />
        <Select
          label="Клуб"
          disabled={!filters.cityId}
          onChange={(event) => onChange({ clubId: event.target.value })}
          options={clubOptions}
          value={filters.clubId}
        />
        <Select
          label="Формат"
          onChange={(event) => onChange({ formatId: event.target.value })}
          options={formatOptions}
          value={filters.formatId}
        />
        <Select
          label="Тип турнира"
          onChange={(event) =>
            onChange({ tournamentType: event.target.value as DashboardFilters['tournamentType'] })
          }
          options={tournamentTypeOptions}
          value={filters.tournamentType}
        />
        <Input
          label="Дата от"
          onChange={(event) => onChange({ dateFrom: event.target.value })}
          type="date"
          value={filters.dateFrom}
        />
        <Input
          label="Дата до"
          onChange={(event) => onChange({ dateTo: event.target.value })}
          type="date"
          value={filters.dateTo}
        />
      </div>
    </Card>
  );
}
