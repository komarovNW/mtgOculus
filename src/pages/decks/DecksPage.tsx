import { useQuery } from '@tanstack/react-query';
import { getDecks } from '@/entities/deck/api';
import type { DeckListItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

const columns: TableColumn<DeckListItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
        {row.isSmallSample ? <Badge variant="warning">Малая выборка</Badge> : null}
      </div>
    ),
  },
  { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge> },
  { id: 'tournaments', header: 'Турниров', align: 'right', render: (row) => row.tournamentsCount },
  { id: 'players', header: 'Игроко-участий', align: 'right', render: (row) => row.playersCount },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  { id: 'record', header: 'Record', align: 'right', render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws) },
  { id: 'winrate', header: 'Winrate', align: 'right', render: (row) => formatPercent(row.matchWinRate) },
  { id: 'best', header: 'Лучшее место', align: 'right', render: (row) => row.bestRank ?? '—' },
];

const sortOptions = [
  { value: 'playersCount_desc', label: 'Популярность' },
  { value: 'matchWinRate_desc', label: 'Winrate' },
  { value: 'matchesCount_desc', label: 'Матчи' },
  { value: 'bestRank_asc', label: 'Лучшее место' },
  { value: 'name_asc', label: 'Название' },
];

export function DecksPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const sort = searchParams.get('sort') || 'playersCount_desc';
  const decksQuery = useQuery({
    queryKey: ['decks', apiFilters, sort],
    queryFn: () => getDecks({ ...apiFilters, sort, page: 1, limit: 50 }),
  });

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(decksQuery.data?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Список колод со сводной статистикой по турнирам и матчам."
        eyebrow="Колоды"
        title="Колоды"
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <Card>
        <div className="toolbar-grid">
          <Select
            label="Сортировка"
            onChange={(event) => updateQueryParams({ sort: event.target.value })}
            options={sortOptions}
            value={sort}
          />
        </div>
      </Card>

      {decksQuery.isLoading ? <LoadingState description="Собираем статистику по колодам." /> : null}
      {decksQuery.isError ? (
        <ErrorState
          description={getErrorMessage(decksQuery.error, 'Не удалось загрузить список колод.')}
          onRetry={() => {
            void decksQuery.refetch();
          }}
        />
      ) : null}

      {decksQuery.isSuccess ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Статистика колод</h2>
              <p className="section-header__description">
                Найдено {decksQuery.data.pagination.total} колод по текущему фильтру.
              </p>
            </div>
          </div>
          <Table
            columns={columns}
            data={decksQuery.data.items}
            emptyMessage="По выбранным фильтрам пока нет колод."
            getRowKey={(row) => row.deck.id}
          />
        </Card>
      ) : null}
    </div>
  );
}

