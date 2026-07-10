import { useQuery } from '@tanstack/react-query';
import { getPlayers } from '@/entities/player/api';
import type { PlayerListItem, PlayersListQuery } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

const columns: TableColumn<PlayerListItem>[] = [
  {
    id: 'player',
    header: 'Игрок',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
        />
        {row.isSmallSample ? <Badge variant="warning">Малая выборка</Badge> : null}
      </div>
    ),
  },
  { id: 'tournaments', header: 'Турниров', align: 'right', render: (row) => row.tournamentsCount },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  { id: 'record', header: 'Record', align: 'right', render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws) },
  { id: 'winrate', header: 'Winrate', align: 'right', render: (row) => formatPercent(row.matchWinRate) },
  { id: 'best', header: 'Лучшее место', align: 'right', render: (row) => row.bestRank ?? '—' },
  {
    id: 'deck',
    header: 'Основная колода',
    render: (row) =>
      row.mostPlayedDeck ? (
        <EntityLink
          id={row.mostPlayedDeck.id}
          name={row.mostPlayedDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

const sortOptions = [
  { value: 'matchWinRate', label: 'Winrate' },
  { value: 'matchesCount', label: 'Матчи' },
  { value: 'tournamentsCount', label: 'Турниры' },
  { value: 'bestRank', label: 'Лучшее место' },
  { value: 'name', label: 'Имя' },
];

export function PlayersPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const search = searchParams.get('search') || '';
  const sort = (searchParams.get('sort') || 'matchWinRate') as NonNullable<PlayersListQuery['sort']>;
  const order = sort === 'name' || sort === 'bestRank' ? 'asc' : 'desc';

  const playersQuery = useQuery({
    queryKey: ['players', apiFilters, search, sort],
    queryFn: () =>
      getPlayers({
        ...apiFilters,
        search: search || undefined,
        sort,
        order,
        page: 1,
        limit: 50,
      }),
  });

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(playersQuery.data?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Список игроков с агрегированной статистикой и подготовкой под будущий поиск."
        eyebrow="Игроки"
        title="Игроки"
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <Card>
        <div className="toolbar-grid">
          <Input
            label="Поиск игрока"
            onChange={(event) => updateQueryParams({ search: event.target.value || undefined })}
            placeholder="Например, Терехов"
            value={search}
          />
          <Select
            label="Сортировка"
            onChange={(event) => updateQueryParams({ sort: event.target.value })}
            options={sortOptions}
            value={sort}
          />
        </div>
      </Card>

      {playersQuery.isLoading ? <LoadingState description="Собираем статистику игроков." /> : null}
      {playersQuery.isError ? (
        <ErrorState
          description={getErrorMessage(playersQuery.error, 'Не удалось загрузить игроков.')}
          onRetry={() => {
            void playersQuery.refetch();
          }}
        />
      ) : null}

      {playersQuery.isSuccess ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Статистика игроков</h2>
              <p className="section-header__description">
                Найдено {playersQuery.data.pagination.total} игроков по текущему срезу.
              </p>
            </div>
          </div>
          <Table
            columns={columns}
            data={playersQuery.data.items}
            emptyMessage="Пока нет игроков по выбранным фильтрам."
            getRowKey={(row) => row.player.id}
          />
        </Card>
      ) : null}
    </div>
  );
}

