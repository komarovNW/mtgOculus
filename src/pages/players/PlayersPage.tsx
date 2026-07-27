import { useInfiniteQuery } from '@tanstack/react-query';
import { getPlayers } from '@/entities/player/api';
import type { PlayerListItem, PlayersListQuery } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  SMALL_SAMPLE_HINT,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
} from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { getNextPageParam, LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

const columns: TableColumn<PlayerListItem>[] = [
  {
    id: 'player',
    header: 'Игрок',
    sortValue: (row) => row.player.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
        />
        {row.isSmallSample ? (
          <Badge
            title={SMALL_SAMPLE_HINT}
            variant="warning"
          >
            Малая выборка
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    id: 'tournaments',
    header: 'Турниров',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.tournamentsCount,
    sortValue: (row) => row.tournamentsCount,
  },
  {
    id: 'matches',
    header: 'Матчей',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.matchesCount,
    sortValue: (row) => row.matchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
    sortValue: (row) => getRecordSortValue(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: WIN_RATE_HINT,
    render: (row) => formatPercent(row.matchWinRate),
    sortValue: (row) => row.matchWinRate,
  },
  {
    id: 'best',
    header: 'Лучшее место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.bestRank ?? '—',
    sortValue: (row) => row.bestRank,
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

const sortOptions = [
  { value: 'matchWinRate', label: 'По проценту побед' },
  { value: 'matchesCount', label: 'По числу матчей' },
  { value: 'tournamentsCount', label: 'По числу турниров' },
  { value: 'bestRank', label: 'По лучшему месту' },
  { value: 'name', label: 'По имени' },
];

export function PlayersPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const search = searchParams.get('search') || '';
  const sort = (searchParams.get('sort') || 'matchWinRate') as NonNullable<PlayersListQuery['sort']>;
  const order = sort === 'name' || sort === 'bestRank' ? 'asc' : 'desc';
  const sortLabelMap: Record<NonNullable<PlayersListQuery['sort']>, string> = {
    matchWinRate: 'по проценту побед',
    matchesCount: 'по количеству матчей',
    tournamentsCount: 'по числу турниров',
    bestRank: 'по лучшему месту',
    name: 'по имени',
  };

  const playersQuery = useInfiniteQuery({
    queryKey: ['players', apiFilters, search, sort],
    queryFn: ({ pageParam }) =>
      getPlayers({
        ...apiFilters,
        search: search || undefined,
        sort,
        order,
        page: pageParam,
        limit: LIST_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const firstPage = playersQuery.data?.pages[0];
  const players = playersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = firstPage?.pagination.total ?? 0;
  const hasInitialData = Boolean(firstPage);

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(firstPage?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Здесь можно найти сильных и активных игроков, а потом открыть их турниры, колоды и матчи."
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
            label="Найти игрока"
            onChange={(event) => updateQueryParams({ search: event.target.value || undefined })}
            placeholder="Например, Игрок 1"
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

      {!hasInitialData && playersQuery.isLoading ? <LoadingState description="Собираем статистику по игрокам." /> : null}
      {!hasInitialData && playersQuery.isError ? (
        <ErrorState
          description={getErrorMessage(playersQuery.error, 'Не получилось загрузить список игроков. Попробуйте обновить страницу или изменить фильтры.')}
          onRetry={() => {
            void playersQuery.refetch();
          }}
        />
      ) : null}

      {firstPage ? (
        <>
          <Card
            className="insights-card"
            tone="muted"
          >
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Быстрый ориентир</h2>
                <p className="section-header__description">
                  Сначала найдите лидеров по нужной метрике, а потом открывайте страницу игрока, если хотите увидеть
                  его турниры, колоды и последние матчи.
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{totalCount}</div>
                <div className="insights-summary__title">игроков найдено</div>
                <p className="insights-summary__description">
                  Сейчас список отсортирован {sortLabelMap[sort]}. Поиск выше помогает быстро найти нужного игрока.
                </p>
              </div>

              <div className="insights-list">
                {players[0] ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Сейчас вверху списка</div>
                    <div className="insight-item__body">
                      <EntityLink
                        id={players[0].player.id}
                        name={players[0].player.name}
                        type="player"
                      />{' '}
                      с {formatPercent(players[0].matchWinRate)} побед и результатом{' '}
                      {formatRecord(
                        players[0].matchWins,
                        players[0].matchLosses,
                        players[0].matchDraws,
                      )}
                      .
                    </div>
                  </article>
                ) : null}

                <article className="insight-item">
                  <div className="insight-item__title">Где статистика уже набралась</div>
                  <div className="insight-item__body">
                    У {players.filter((item) => !item.isSmallSample).length} игроков уже достаточно
                    матчей, чтобы процент побед выглядел надёжнее.
                  </div>
                </article>

                <article className="insight-item">
                  <div className="insight-item__title">Что делать дальше</div>
                  <div className="insight-item__body">
                    Откройте страницу игрока, если хотите посмотреть его турниры, любимые колоды и недавние матчи.
                  </div>
                </article>
              </div>
            </div>
          </Card>

          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Все игроки</h2>
                <p className="section-header__description">
                  Найдено {totalCount} игроков. Нажмите на имя, чтобы открыть страницу игрока и
                  подробную статистику.
                </p>
              </div>
            </div>
            <Table
              columns={columns}
              data={players}
              emptyMessage="По этим фильтрам пока нет игроков."
              getRowKey={(row) => row.player.id}
              minWidth={1120}
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
        </>
      ) : null}
    </div>
  );
}
