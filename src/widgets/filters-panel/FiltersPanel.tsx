import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dictionaryQueries } from '@/entities/dictionaries/queries';
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
  showFormat?: boolean;
  requireFormat?: boolean;
  showTournamentType?: boolean;
};

export function FiltersPanel({
  filters,
  onChange,
  onReset,
  showFormat = true,
  requireFormat = false,
  showTournamentType = true,
}: FiltersPanelProps) {
  const citiesQuery = useQuery(dictionaryQueries.cities());
  const formatsQuery = useQuery({
    ...dictionaryQueries.formats(),
    enabled: showFormat,
  });
  const clubsQuery = useQuery(dictionaryQueries.clubs(filters.cityId));
  const [draftDateFrom, setDraftDateFrom] = useState(filters.dateFrom);
  const [draftDateTo, setDraftDateTo] = useState(filters.dateTo);

  useEffect(() => {
    setDraftDateFrom(filters.dateFrom);
    setDraftDateTo(filters.dateTo);
  }, [filters.dateFrom, filters.dateTo]);

  const dateRangeDirty = draftDateFrom !== filters.dateFrom || draftDateTo !== filters.dateTo;
  const dateRangeInvalid = Boolean(draftDateFrom && draftDateTo && draftDateFrom > draftDateTo);

  function resetDraftDates() {
    setDraftDateFrom(filters.dateFrom);
    setDraftDateTo(filters.dateTo);
  }

  function handleReset() {
    setDraftDateFrom('');
    setDraftDateTo('');
    onReset();
  }

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
    { value: '', label: formatsQuery.isLoading ? 'Загружаем форматы...' : requireFormat ? 'Выберите формат' : 'Все форматы' },
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
    showTournamentType && filters.tournamentType !== defaultFilters.tournamentType,
    filters.dateFrom !== defaultFilters.dateFrom,
    filters.dateTo !== defaultFilters.dateTo,
    filters.cityId !== defaultFilters.cityId,
    showFormat && filters.formatId !== defaultFilters.formatId,
  ].filter(Boolean).length;

  return (
    <Card className="filters-panel">
      <div className="section-header">
        <div>
          <div className="section-header__title-row">
            <h2 className="section-header__title">Фильтры</h2>
            <Badge>{activeExtraFiltersCount > 0 ? `Выбрано: ${activeExtraFiltersCount}` : 'Все данные'}</Badge>
          </div>
          <p className="section-header__description">
            Выберите город, клуб
            {showFormat ? ', формату' : ''}
            {showTournamentType ? ', тип события' : ''} и период.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleReset}
          type="button"
        >
          Сбросить фильтры
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
        {showFormat ? (
          <Select
            label="Формат"
            required={requireFormat}
            onChange={(event) => onChange({ formatId: event.target.value })}
            options={formatOptions}
            value={filters.formatId}
          />
        ) : null}
        {showTournamentType ? (
          <Select
            label="Тип события"
            onChange={(event) =>
              onChange({ tournamentType: event.target.value as DashboardFilters['tournamentType'] })
            }
            options={tournamentTypeOptions}
            value={filters.tournamentType}
          />
        ) : null}
        <form
          className="filters-date-range"
          onSubmit={(event) => {
            event.preventDefault();
            if (dateRangeDirty && !dateRangeInvalid) {
              onChange({ dateFrom: draftDateFrom, dateTo: draftDateTo });
            }
          }}
        >
          <Input
            label="Дата от"
            onChange={(event) => setDraftDateFrom(event.target.value)}
            type="date"
            value={draftDateFrom}
          />
          <Input
            label="Дата до"
            onChange={(event) => setDraftDateTo(event.target.value)}
            type="date"
            value={draftDateTo}
          />
          <div className="filters-date-range__actions">
            <Button disabled={!dateRangeDirty || dateRangeInvalid} type="submit" variant="secondary">
              Применить период
            </Button>
            <Button disabled={!dateRangeDirty} onClick={resetDraftDates} type="button" variant="ghost">
              Отменить
            </Button>
          </div>
          {dateRangeInvalid ? (
            <span className="filters-date-range__error" role="alert">
              Дата начала должна быть не позже даты окончания.
            </span>
          ) : null}
        </form>
      </div>
    </Card>
  );
}
