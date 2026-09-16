import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getAllTournaments, getTournaments } from '@/entities/tournament/api';
import type { TournamentListItem, TournamentType } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { getDailyInsights } from '@/shared/lib/dailyInsights';
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
import { DailyAttendanceChart } from '@/widgets/daily-attendance/DailyAttendanceChart';
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
    header: 'Сыгранных матчей',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.playedMatchesCount,
    sortValue: (row) => row.playedMatchesCount,
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

type TournamentsPageProps = {
  eventType?: TournamentType;
};

export function TournamentsPage({ eventType = 'tournament' }: TournamentsPageProps) {
  const isDaily = eventType === 'daily';
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const eventNoun = isDaily ? 'дейлик' : 'турнир';
  const eventPlural = isDaily ? 'дейлики' : 'турниры';
  const eventNounPlural = isDaily ? 'дейликов' : 'турниров';
  const eventTitle = isDaily ? 'Дейлики' : 'Турниры';
  const tableColumns = columns
    .filter(
      (column) =>
        column.id !== 'type' &&
        column.id !== 'rounds' &&
        column.id !== 'matches' &&
        (!filters.clubId || column.id !== 'club') &&
        (!filters.formatId || column.id !== 'format'),
    )
    .map((column) => {
      if (!isDaily || column.id !== 'winner') {
        return isDaily && column.id === 'title'
          ? { ...column, header: 'Дейлик' }
          : column;
      }

      return {
        ...column,
        header: 'Победитель и колода',
        render: (row: TournamentListItem) =>
          row.winner ? (
            <div className="stacked-cell">
              <EntityLink
                id={row.winner.player.id}
                name={row.winner.player.name}
                type="player"
              />
              {row.winner.deck ? (
                <EntityLink
                  colors={row.winner.deck.colors}
                  id={row.winner.deck.id}
                  name={row.winner.deck.name}
                  type="deck"
                />
              ) : (
                <span className="muted-text">Колода не указана</span>
              )}
            </div>
          ) : (
            '—'
          ),
      };
    });
  const tournamentsQuery = useInfiniteQuery({
    queryKey: ['tournaments', apiFilters, eventType],
    queryFn: ({ pageParam, signal }) =>
      getTournaments({
        ...apiFilters,
        tournamentType: eventType,
        page: pageParam,
        limit: LIST_PAGE_SIZE,
      }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const dailyInsightsQuery = useQuery({
    queryKey: ['daily-insights', apiFilters],
    queryFn: ({ signal }) =>
      getAllTournaments({
        ...apiFilters,
        tournamentType: 'daily',
      }, { signal }),
    enabled: isDaily && hasActiveFilters,
  });
  const firstPage = tournamentsQuery.data?.pages[0];
  const tournaments = tournamentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = firstPage?.pagination.total ?? 0;
  const hasInitialData = Boolean(firstPage);
  const dailyInsights = getDailyInsights(dailyInsightsQuery.data ?? []);
  const averagePlayersLabel = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(dailyInsights.averagePlayers);
  const attendanceTrendLabel = dailyInsights.attendanceTrend
    ? (() => {
        const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
        const recent = formatter.format(dailyInsights.attendanceTrend.recentAverage);
        const difference = formatter.format(Math.abs(dailyInsights.attendanceTrend.difference));

        if (Math.abs(dailyInsights.attendanceTrend.difference) < 0.05) {
          return `Последние четыре дейлика: ${recent} в среднем — без изменений.`;
        }

        return `Последние четыре дейлика: ${recent} в среднем — ${
          dailyInsights.attendanceTrend.difference > 0 ? 'рост' : 'снижение'
        } на ${difference}.`;
      })()
    : undefined;

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
      {isDaily && hasActiveFilters && dailyInsightsQuery.isError ? (
        <ErrorState
          description={getErrorMessage(
            dailyInsightsQuery.error,
            'Не получилось собрать общую статистику по дейликам.',
          )}
          onRetry={() => {
            void dailyInsightsQuery.refetch();
          }}
        />
      ) : null}

      {firstPage ? (
        <>
          {isDaily && hasActiveFilters ? <Card className="insights-card" tone="muted">
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Посещаемость</h2>
                <p className="section-header__description">
                  Среднее значение и рекорд по всем дейликам, попавшим под текущие фильтры.
                </p>
              </div>
            </div>

            <div className="insights-list attendance-summary">
                    {dailyInsightsQuery.isLoading ? (
                      <article className="insight-item">
                        <div className="insight-item__title">Собираем ориентир</div>
                        <div className="insight-item__body">
                          Собираем общую статистику по выбранным фильтрам.
                        </div>
                      </article>
                    ) : null}
                    {dailyInsightsQuery.isSuccess ? (
                      <article className="insight-item">
                        <div className="insight-item__title">Средняя посещаемость</div>
                        <div className="insight-item__body">
                          {averagePlayersLabel} игроков на один дейлик.
                          {attendanceTrendLabel ? (
                            <span className="muted-text">{attendanceTrendLabel}</span>
                          ) : null}
                        </div>
                      </article>
                    ) : null}
                    {dailyInsights.biggestDaily ? (
                      <article className="insight-item">
                        <div className="insight-item__title">Рекорд посещаемости</div>
                        <div className="insight-item__body">
                          <EntityLink
                            id={dailyInsights.biggestDaily.id}
                            name={dailyInsights.biggestDaily.title}
                            type="tournament"
                          />{' '}
                          собрал {dailyInsights.biggestDaily.playersCount} игроков.
                        </div>
                      </article>
                    ) : null}
                    {!filters.clubId && dailyInsights.mostActiveClub ? (
                      <article className="insight-item">
                        <div className="insight-item__title">Самый активный клуб</div>
                        <div className="insight-item__body">
                          {dailyInsights.mostActiveClub.club.name} —{' '}
                          {dailyInsights.mostActiveClub.eventsCount} дейликов.
                        </div>
                      </article>
                    ) : null}
            </div>
          </Card> : null}

          {isDaily && hasActiveFilters && dailyInsightsQuery.isSuccess ? (
            <DailyAttendanceChart items={dailyInsightsQuery.data} />
          ) : null}

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
              columns={tableColumns}
              data={tournaments}
              emptyMessage={`По этим фильтрам пока нет загруженных ${eventNounPlural}.`}
              getRowKey={(row) => row.id}
              layout="fixed"
              minWidth={isDaily ? 720 : 880}
              isPartial={tournaments.length < totalCount}
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
