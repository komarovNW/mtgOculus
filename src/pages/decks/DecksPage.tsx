import { useInfiniteQuery } from '@tanstack/react-query';
import { getDecks } from '@/entities/deck/api';
import type { DeckListItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  SMALL_SAMPLE_HINT,
  TOURNAMENT_PARTICIPATIONS_HINT,
  TOURNAMENT_PARTICIPATIONS_LABEL,
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

const columns: TableColumn<DeckListItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck.name,
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          colors={row.deck.colors}
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
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
  { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge>, sortValue: (row) => row.format.name },
  {
    id: 'tournaments',
    header: 'Турниров',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.tournamentsCount,
    sortValue: (row) => row.tournamentsCount,
  },
  {
    id: 'players',
    header: TOURNAMENT_PARTICIPATIONS_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: TOURNAMENT_PARTICIPATIONS_HINT,
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
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
];

const sortOptions = [
  { value: 'playersCount_desc', label: 'По популярности' },
  { value: 'matchWinRate_desc', label: 'По проценту побед' },
  { value: 'matchesCount_desc', label: 'По числу матчей' },
  { value: 'bestRank_asc', label: 'По лучшему месту' },
  { value: 'name_asc', label: 'По названию' },
];

export function DecksPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'playersCount_desc';
  const decksQuery = useInfiniteQuery({
    queryKey: ['decks', apiFilters, search, sort],
    queryFn: ({ pageParam }) =>
      getDecks({ ...apiFilters, search: search || undefined, sort, page: pageParam, limit: LIST_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const firstPage = decksQuery.data?.pages[0];
  const decks = decksQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = firstPage?.pagination.total ?? 0;
  const hasInitialData = Boolean(firstPage);

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(firstPage?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description="Здесь удобно сравнивать популярность колод, их результаты и быстро переходить к турнирам и матчапам."
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
          <Input
            label="Найти колоду"
            onChange={(event) => updateQueryParams({ search: event.target.value || undefined })}
            placeholder="Например, Mono Red Aggro"
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

      {!hasInitialData && decksQuery.isLoading ? <LoadingState description="Собираем статистику по колодам." /> : null}
      {!hasInitialData && decksQuery.isError ? (
        <ErrorState
          description={getErrorMessage(decksQuery.error, 'Не получилось загрузить список колод. Попробуйте обновить страницу или изменить фильтры.')}
          onRetry={() => {
            void decksQuery.refetch();
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
                  Сначала смотрите, чем играют чаще всего и какие колоды уже набрали матчи, а потом открывайте нужную
                  колоду для турниров, игроков и матчапов.
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{totalCount}</div>
                <div className="insights-summary__title">колод найдено</div>
                <p className="insights-summary__description">
                  Сортировку можно менять в один клик, а поиск выше помогает быстро найти нужную колоду.
                </p>
              </div>

              <div className="insights-list">
                {decks.length > 0 ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Самая популярная колода</div>
                    <div className="insight-item__body">
                      {(() => {
                        const popularDeck = [...decks].sort(
                          (left, right) => right.playersCount - left.playersCount || right.matchesCount - left.matchesCount,
                        )[0];

                        return (
                          <>
                            <EntityLink
                              colors={popularDeck.deck.colors}
                              id={popularDeck.deck.id}
                              name={popularDeck.deck.name}
                              type="deck"
                            />{' '}
                            встречалась {popularDeck.playersCount} раз и сыграла {popularDeck.matchesCount} матчей.
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ) : null}

                {decks.length > 0 ? (
                  <article className="insight-item">
                    <div className="insight-item__title">По результатам впереди</div>
                    <div className="insight-item__body">
                      {(() => {
                        const bestStableDeck =
                          [...decks]
                            .filter((item) => !item.isSmallSample)
                            .sort(
                              (left, right) =>
                                right.matchWinRate - left.matchWinRate || right.matchesCount - left.matchesCount,
                            )[0] ?? decks[0];

                        return (
                          <>
                            <EntityLink
                              colors={bestStableDeck.deck.colors}
                              id={bestStableDeck.deck.id}
                              name={bestStableDeck.deck.name}
                              type="deck"
                            />{' '}
                            с {formatPercent(bestStableDeck.matchWinRate)} побед за {bestStableDeck.matchesCount} матчей.
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ) : null}

                <article className="insight-item">
                  <div className="insight-item__title">Где статистика уже набралась</div>
                  <div className="insight-item__body">
                    У {decks.filter((item) => !item.isSmallSample).length} колод уже хватает матчей,
                    чтобы процент побед выглядел надёжнее.
                  </div>
                </article>
              </div>
            </div>
          </Card>

          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Все колоды</h2>
                <p className="section-header__description">
                  Найдено {totalCount} колод. Нажмите на колоду, чтобы открыть турниры, игроков и
                  матчапы.
                </p>
              </div>
            </div>
            <Table
              columns={columns}
              data={decks}
              emptyMessage={search ? 'По этому запросу колоды не найдены.' : 'По этим фильтрам пока нет колод.'}
              getRowKey={(row) => row.deck.id}
              minWidth={1100}
            />
            <LoadMorePagination
              hasMore={decksQuery.hasNextPage}
              isError={decksQuery.isFetchNextPageError}
              isLoading={decksQuery.isFetchingNextPage}
              loadedCount={decks.length}
              onLoadMore={() => {
                void decksQuery.fetchNextPage();
              }}
              totalCount={totalCount}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
