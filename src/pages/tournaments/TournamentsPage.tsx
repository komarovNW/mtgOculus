import { useInfiniteQuery } from '@tanstack/react-query';
import { getTournaments } from '@/entities/tournament/api';
import type { TournamentListItem, TournamentType } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { getNextPageParam, LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

const columns: TableColumn<TournamentListItem>[] = [
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.date),
    sortValue: (row) => row.date,
  },
  {
    id: 'title',
    header: 'Турнир',
    sortValue: (row) => row.title,
    render: (row) => (
      <EntityLink
        id={row.id}
        name={row.title}
        type="tournament"
      />
    ),
  },
  {
    id: 'type',
    header: 'Тип',
    sortValue: (row) => row.type,
    render: (row) => <Badge variant="accent">{row.type === 'daily' ? 'Дейлик' : 'Турнир'}</Badge>,
  },
  { id: 'club', header: 'Клуб', render: (row) => row.club.name, sortValue: (row) => row.club.name },
  { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge>, sortValue: (row) => row.format.name },
  {
    id: 'players',
    header: 'Игроков',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
  },
  {
    id: 'rounds',
    header: 'Раундов',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.roundsCount,
    sortValue: (row) => row.roundsCount,
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
    id: 'winner',
    header: 'Победитель',
    sortValue: (row) => row.winner?.player.name,
    render: (row) =>
      row.winner ? (
        <EntityLink
          id={row.winner.player.id}
          name={row.winner.player.name}
          type="player"
        />
      ) : (
        '—'
      ),
  },
];

const scopedColumns = columns.filter((column) => column.id !== 'type');

type TournamentsPageProps = {
  eventType?: TournamentType;
};

export function TournamentsPage({ eventType = 'tournament' }: TournamentsPageProps) {
  const isDaily = eventType === 'daily';
  const eventNoun = isDaily ? 'дейлик' : 'турнир';
  const eventPlural = isDaily ? 'дейлики' : 'турниры';
  const eventNounPlural = isDaily ? 'дейликов' : 'турниров';
  const eventTitle = isDaily ? 'Дейлики' : 'Турниры';
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const tournamentsQuery = useInfiniteQuery({
    queryKey: ['tournaments', apiFilters, eventType],
    queryFn: ({ pageParam }) =>
      getTournaments({
        ...apiFilters,
        tournamentType: eventType,
        page: pageParam,
        limit: LIST_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const firstPage = tournamentsQuery.data?.pages[0];
  const tournaments = tournamentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = firstPage?.pagination.total ?? 0;
  const hasInitialData = Boolean(firstPage);

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(firstPage?.appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description={
          isDaily
            ? 'Здесь собраны регулярные дейлики: можно открыть стендинги, пары и колоды участников.'
            : 'Здесь собраны крупные турниры: можно открыть стендинги, пары и колоды участников.'
        }
        eyebrow={eventTitle}
        title={eventTitle}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        showTournamentType={false}
      />

      {!hasInitialData && tournamentsQuery.isLoading ? (
        <LoadingState description={`Собираем список ${eventNounPlural}.`} />
      ) : null}
      {!hasInitialData && tournamentsQuery.isError ? (
        <ErrorState
          description={getErrorMessage(
            tournamentsQuery.error,
            `Не получилось загрузить список ${eventNounPlural}. Попробуйте обновить страницу или изменить фильтры.`,
          )}
          onRetry={() => {
            void tournamentsQuery.refetch();
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
                  Сначала смотрите свежие и крупные события, а потом открывайте нужный {eventNoun}, если нужны
                  стендинги, пары и метагейм.
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{totalCount}</div>
                <div className="insights-summary__title">{eventNounPlural} найдено</div>
                <p className="insights-summary__description">
                  Фильтры выше помогут быстро оставить только нужный клуб, формат или период.
                </p>
              </div>

              <div className="insights-list">
                {tournaments[0] ? (
                <article className="insight-item">
                  <div className="insight-item__title">Самый свежий {eventNoun}</div>
                  <div className="insight-item__body">
                      <EntityLink
                        id={tournaments[0].id}
                        name={tournaments[0].title}
                        type="tournament"
                      />{' '}
                      на {tournaments[0].playersCount} игроков.
                    </div>
                  </article>
                ) : null}

                {tournaments.length > 0 ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Самый большой {eventNoun} в списке</div>
                    <div className="insight-item__body">
                      {(() => {
                        const biggestTournament = [...tournaments].sort(
                          (left, right) => right.playersCount - left.playersCount || right.matchesCount - left.matchesCount,
                        )[0];

                        return (
                          <>
                            <EntityLink
                              id={biggestTournament.id}
                              name={biggestTournament.title}
                              type="tournament"
                            />{' '}
                            собрал {biggestTournament.playersCount} игроков и {biggestTournament.matchesCount} матчей.
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ) : null}

                <article className="insight-item">
                  <div className="insight-item__title">Что делать дальше</div>
                  <div className="insight-item__body">
                    Откройте {eventNoun} по названию, если хотите посмотреть итоговые места, пары по раундам и колоды
                    всех участников.
                  </div>
                </article>
              </div>
            </div>

          </Card>

          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Все {eventPlural}</h2>
                <p className="section-header__description">
                  Найдено {totalCount} {eventNounPlural}. Нажмите на {eventNoun}, чтобы открыть его страницу.
                </p>
              </div>
            </div>
            <Table
              columns={scopedColumns}
              data={tournaments}
              emptyMessage={`По этим фильтрам пока нет загруженных ${eventNounPlural}.`}
              getRowKey={(row) => row.id}
              layout="fixed"
              minWidth={880}
            />
            <LoadMorePagination
              hasMore={tournamentsQuery.hasNextPage}
              isError={tournamentsQuery.isFetchNextPageError}
              isLoading={tournamentsQuery.isFetchingNextPage}
              loadedCount={tournaments.length}
              onLoadMore={() => {
                void tournamentsQuery.fetchNextPage();
              }}
              totalCount={totalCount}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
