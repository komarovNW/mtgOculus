import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getAllPlayers, getPlayers } from '@/entities/player/api';
import type { PlayerListItem, PlayersListQuery } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import {
  ESTABLISHED_PLAYER_SAMPLE_HINT,
  isEstablishedPlayer,
} from '@/shared/lib/establishedPlayers';
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
import { getPlayerListInsights } from '@/shared/lib/playerListInsights';
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
import { PlayerActivityOverview } from '@/widgets/player-activity/PlayerActivityOverview';
import { PlayerFavoriteDecks } from '@/widgets/player-favorite-decks/PlayerFavoriteDecks';

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
        {!isEstablishedPlayer(row) ? (
          <Badge
            title={ESTABLISHED_PLAYER_SAMPLE_HINT}
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
    header: 'Результатов учтено',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => (
      <div className="stacked-cell stacked-cell--end">
        <span>{row.matchesCount}</span>
        {row.byesCount ? (
          <span className="muted-text">включая {row.byesCount} BYE</span>
        ) : null}
      </div>
    ),
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
  { value: 'matchesCount', label: 'По числу матчей' },
  { value: 'tournamentsCount', label: 'По числу турниров' },
  { value: 'name', label: 'По имени' },
];

export function PlayersPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const search = searchParams.get('search') || '';
  const requestedSort = searchParams.get('sort');
  const sort: NonNullable<PlayersListQuery['sort']> =
    requestedSort === 'tournamentsCount' || requestedSort === 'name'
      ? requestedSort
      : 'matchesCount';
  const order = sort === 'name' ? 'asc' : 'desc';
  const sortLabelMap: Record<'matchesCount' | 'tournamentsCount' | 'name', string> = {
    matchesCount: 'по количеству матчей',
    tournamentsCount: 'по числу турниров',
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
  const playerInsightsQuery = useQuery({
    queryKey: ['player-list-insights', apiFilters, search],
    queryFn: () =>
      getAllPlayers({
        ...apiFilters,
        search: search || undefined,
        sort: 'matchesCount',
        order: 'desc',
      }),
  });
  const firstPage = playersQuery.data?.pages[0];
  const players = playersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = firstPage?.pagination.total ?? 0;
  const hasInitialData = Boolean(firstPage);
  const playerInsights = getPlayerListInsights(playerInsightsQuery.data ?? []);

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
        <>
          <Card
            className="insights-card"
            tone="muted"
          >
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Быстрый ориентир</h2>
                <p className="section-header__description">
                  Сводка строится по всем игрокам из текущей выборки и не зависит от
                  сортировки или загруженной страницы.
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{totalCount}</div>
                <div className="insights-summary__title">игроков найдено</div>
                <p className="insights-summary__description">
                  Таблица отсортирована {sortLabelMap[sort]}. Для сравнения результатов
                  нужен минимум 20 матчей в 5 турнирах.
                </p>
              </div>

              <div className="insights-list">
                {playerInsightsQuery.isLoading ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Собираем ориентир</div>
                    <div className="insight-item__body">
                      Загружаем все страницы игроков по текущим фильтрам.
                    </div>
                  </article>
                ) : null}
                {playerInsightsQuery.isError ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Ориентир временно недоступен</div>
                    <div className="insight-item__body">
                      Не получилось собрать общую статистику. Таблица игроков ниже
                      продолжает работать.
                    </div>
                  </article>
                ) : null}

                {playerInsights.bestEstablishedPlayer ? (
                  <article className="insight-item">
                    <div className="insight-item__title">
                      Лучший результат на достаточной выборке
                    </div>
                    <div className="insight-item__body">
                      <EntityLink
                        id={playerInsights.bestEstablishedPlayer.player.id}
                        name={playerInsights.bestEstablishedPlayer.player.name}
                        type="player"
                      />{' '}
                      — {formatPercent(playerInsights.bestEstablishedPlayer.matchWinRate)} побед,
                      результат{' '}
                      {formatRecord(
                        playerInsights.bestEstablishedPlayer.matchWins,
                        playerInsights.bestEstablishedPlayer.matchLosses,
                        playerInsights.bestEstablishedPlayer.matchDraws,
                      )}{' '}
                      за {playerInsights.bestEstablishedPlayer.matchesCount} матчей в{' '}
                      {playerInsights.bestEstablishedPlayer.tournamentsCount} турнирах.
                    </div>
                  </article>
                ) : null}

                {playerInsights.mostActivePlayer ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Самый активный игрок</div>
                    <div className="insight-item__body">
                      <EntityLink
                        id={playerInsights.mostActivePlayer.player.id}
                        name={playerInsights.mostActivePlayer.player.name}
                        type="player"
                      />{' '}
                      сыграл {playerInsights.mostActivePlayer.matchesCount} матчей в{' '}
                      {playerInsights.mostActivePlayer.tournamentsCount} турнирах.
                    </div>
                  </article>
                ) : null}

                {playerInsightsQuery.isSuccess ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Достаточная выборка</div>
                    <div className="insight-item__body">
                      Порог 20 матчей в 5 турнирах прошли{' '}
                      {playerInsights.establishedPlayersCount} из {totalCount} игроков.
                    </div>
                  </article>
                ) : null}
              </div>
            </div>
          </Card>

          {playerInsightsQuery.isSuccess ? (
            <>
              <PlayerActivityOverview insights={playerInsights} />
              <PlayerFavoriteDecks items={playerInsights.favoriteDecks} />
            </>
          ) : null}

          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Все игроки</h2>
                <p className="section-header__description">
                  Найдено {totalCount} игроков. Нажмите на имя, чтобы открыть страницу игрока и
                  подробную статистику. По умолчанию первыми идут игроки с наибольшим
                  количеством матчей.
                </p>
              </div>
            </div>
            <Table
              columns={columns}
              data={players}
              emptyMessage="По этим фильтрам пока нет игроков."
              getRowKey={(row) => row.player.id}
              minWidth={980}
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
