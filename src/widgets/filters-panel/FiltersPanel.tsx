import { useQuery } from '@tanstack/react-query';
import { getCities, getClubs, getFormats } from '@/entities/dictionaries/api';
import type { DashboardFilters } from '@/shared/api/types';
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
    { value: '', label: citiesQuery.isLoading ? 'Загрузка городов...' : 'Выберите город' },
    ...(citiesQuery.data?.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const clubOptions = [
    { value: '', label: clubsQuery.isLoading ? 'Загрузка клубов...' : 'Все клубы' },
    ...(clubsQuery.data?.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const formatOptions = [
    { value: '', label: formatsQuery.isLoading ? 'Загрузка форматов...' : 'Выберите формат' },
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

  return (
    <Card className="filters-panel">
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Фильтры</h2>
          <p className="section-header__description">
            Соберите нужный срез по городу, клубу, формату, типу турнира и периоду.
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
