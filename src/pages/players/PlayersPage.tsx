import { useInfiniteQuery } from '@tanstack/react-query';
import { getPlayers } from '@/entities/player/api';
import type { DashboardFilters, PlayerListItem, PlayersListQuery } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import {
  ESTABLISHED_PLAYER_SAMPLE_HINT,
  isEstablishedPlayer,
} from '@/shared/lib/establishedPlayers';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
} from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { getNextPageParam, LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

function getColumns(tournamentType: DashboardFilters['tournamentType']): TableColumn<PlayerListItem>[] {
  const eventsLabel = tournamentType === 'daily'
    ? 'Дейликов'
    : tournamentType === 'tournament'
      ? 'Турниров'
      : 'Дейлики / турниры';
  const lastEventLabel = tournamentType === 'daily'
    ? 'Последний дейлик'
    : tournamentType === 'tournament'
      ? 'Последний турнир'
      : 'Последнее участие';

  return [
    {
      id: 'player',
      header: 'Игрок',
      sortValue: (row) => row.player.name,
      render: (row) => (
        <div className="entity-cell">
          <div className="stacked-cell">
            <EntityLink
              id={row.player.id}
              name={row.player.name}
              type="player"
            />
            {row.lastTournamentDate ? (
              <span className="entity-cell__meta">
                {lastEventLabel} · {formatDate(row.lastTournamentDate)}
              </span>
            ) : null}
          </div>
          {!isEstablishedPlayer(row) ? (
            <Badge
              title={ESTABLISHED_PLAYER_SAMPLE_HINT}
              variant="warning"
            >
              Мало данных
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: 'tournaments',
      header: eventsLabel,
      align: 'center',
      defaultSortDirection: 'desc',
      render: (row) => row.tournamentsCount,
      sortValue: (row) => row.tournamentsCount,
    },
    {
      id: 'undefeatedTops',
      header: 'Без поражений',
      align: 'center',
      headerTitle: 'Турниры, в которых игрок прошёл все раунды без поражений и ничьих.',
      defaultSortDirection: 'desc',
      render: (row) => row.undefeatedTopsCount ?? '—',
      sortValue: (row) => row.undefeatedTopsCount,
    },
    {
      id: 'matches',
      header: 'Сыграно матчей',
      align: 'center',
      defaultSortDirection: 'desc',
      render: (row) => row.playedMatchesCount,
      sortValue: (row) => row.playedMatchesCount,
    },
    {
      id: 'record',
      header: MATCH_RECORD_LABEL,
      align: 'center',
      defaultSortDirection: 'desc',
      headerTitle: MATCH_RECORD_HINT,
      render: (row) => formatRecord(row.playedWins, row.matchLosses, row.matchDraws),
      sortValue: (row) => getRecordSortValue(row.playedWins, row.matchLosses, row.matchDraws),
    },
    {
      id: 'winrate',
      header: WIN_RATE_LABEL,
      align: 'center',
      defaultSortDirection: 'desc',
      headerTitle: WIN_RATE_HINT,
      render: (row) => formatPercent(row.matchWinRate),
      sortValue: (row) => row.matchWinRate,
    },
    {
      id: 'deck',
      header: 'Любимая колода',
      sortValue: (row) => row.mostPlayedDeck?.name,
      render: (row) =>
        row.mostPlayedDeck ? (
          <EntityLink
            colors={row.mostPlayedDeck.colors}
            id={row.mostPlayedDeck.id}
            name={row.mostPlayedDeck.name}
            type="deck"
          />
        ) : (
          '—'
        ),
    },
  ];
}

const sortOptions = [
  { value: 'matchesCount', label: 'По числу матчей' },
  { value: 'tournamentsCount', label: 'По числу турниров' },
  { value: 'name', label: 'По имени' },
];

export function PlayersPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const search = searchParams.get('search') || '';
  const debouncedSearch = useDebouncedValue(search.trim());
  const isSearchPending = debouncedSearch !== search.trim();
  const requestedSort = searchParams.get('sort');
  const sort: NonNullable<PlayersListQuery['sort']> =
    requestedSort === 'tournamentsCount' || requestedSort === 'name'
      ? requestedSort
      : 'matchesCount';
  const order = sort === 'name' ? 'asc' : 'desc';
  const playersQuery = useInfiniteQuery({
    enabled: !isSearchPending,
    queryKey: ['players', apiFilters, debouncedSearch, sort],
    queryFn: ({ pageParam, signal }) =>
      getPlayers({
        ...apiFilters,
        search: debouncedSearch || undefined,
        sort,
        order,
        page: pageParam,
        limit: LIST_PAGE_SIZE,
      }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const firstPage = isSearchPending ? undefined : playersQuery.data?.pages[0];
  const players = playersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = firstPage?.pagination.total ?? 0;
  const hasInitialData = Boolean(firstPage);
  const hasUndefeatedTops = players.some(
    (player) => player.undefeatedTopsCount !== null && player.undefeatedTopsCount !== undefined,
  );
  const tableColumns = getColumns(filters.tournamentType).filter((column) => {
    if (column.id === 'deck' && !filters.formatId) {
      return false;
    }

    if (column.id === 'undefeatedTops' && !hasUndefeatedTops) {
      return false;
    }

    return true;
  });
  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(firstPage?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Найдите игрока и посмотрите его результаты, колоды и матчи."
        eyebrow="Статистика игроков"
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
            label="Найти игрока"
            onChange={(event) => updateQueryParams({ search: event.target.value || undefined })}
            placeholder="Имя игрока"
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

      {!hasInitialData && (isSearchPending || playersQuery.isLoading) ? <LoadingState description="Собираем статистику по игрокам." /> : null}
      {!hasInitialData && !isSearchPending && playersQuery.isError ? (
        <ErrorState
          description={getErrorMessage(playersQuery.error, 'Не получилось загрузить список игроков. Попробуйте обновить страницу или изменить фильтры.')}
          onRetry={() => {
            void playersQuery.refetch();
          }}
        />
      ) : null}

      {firstPage ? totalCount === 0 ? (
        <EmptyState
          description={
            search
              ? 'Попробуйте изменить запрос или сбросить фильтры.'
              : 'Попробуйте изменить или сбросить выбранные фильтры.'
          }
          title={search ? 'Игроки по этому запросу не найдены' : 'По этим фильтрам нет игроков'}
        />
      ) : (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Список игроков</h2>
              <p className="section-header__description">
                {`Найдено ${totalCount} игроков.`}
              </p>
            </div>
          </div>
          <Table
            columns={tableColumns}
            data={players}
            emptyMessage="По этим фильтрам пока нет игроков."
            getRowKey={(row) => row.player.id}
            minWidth={(filters.formatId ? 900 : 760) + (hasUndefeatedTops ? 130 : 0)}
            isPartial={players.length < totalCount}
          />
          <LoadMorePagination
            hasMore={playersQuery.hasNextPage}
            isError={playersQuery.isFetchNextPageError}
            isLoading={playersQuery.isFetchingNextPage}
            loadedCount={players.length}
            onLoadMore={() => {
              void playersQuery.fetchNextPage();
            }}
            totalCount={totalCount}
          />
        </Card>
      ) : null}
    </div>
  );
}
