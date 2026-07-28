import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getAllDecks, getDecks } from '@/entities/deck/api';
import type { DeckListItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { getDeckListInsights } from '@/shared/lib/deckListInsights';
import {
  ESTABLISHED_DECK_SAMPLE_HINT,
  isEstablishedDeck,
} from '@/shared/lib/establishedDecks';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  TOURNAMENT_PARTICIPATIONS_HINT,
  TOURNAMENT_PARTICIPATIONS_LABEL,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
} from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { getNextPageParam, LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Select } from '@/shared/ui/Select';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { DeckActivityOverview } from '@/widgets/deck-activity/DeckActivityOverview';
import { EstablishedDeckResults } from '@/widgets/established-deck-results/EstablishedDeckResults';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

const columns: TableColumn<DeckListItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          colors={row.deck.colors}
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
        {!isEstablishedDeck(row) ? (
          <Badge
            title={ESTABLISHED_DECK_SAMPLE_HINT}
            variant="warning"
          >
            Малая выборка
          </Badge>
        ) : null}
      </div>
    ),
  },
  { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge> },
  {
    id: 'tournaments',
    header: 'Турниров',
    align: 'right',
    render: (row) => row.tournamentsCount,
  },
  {
    id: 'players',
    header: TOURNAMENT_PARTICIPATIONS_LABEL,
    align: 'right',
    headerTitle: TOURNAMENT_PARTICIPATIONS_HINT,
    render: (row) => row.playersCount,
  },
  {
    id: 'matches',
    header: 'Матчей против соперника',
    align: 'right',
    render: (row) => row.playedMatchesCount ?? row.matchesCount,
  },
  {
    id: 'record',
    header: MATCH_RECORD_LABEL,
    align: 'right',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: WIN_RATE_LABEL,
    align: 'right',
    headerTitle: WIN_RATE_HINT,
    render: (row) => formatPercent(row.matchWinRate),
  },
];

const sortOptions = [
  { value: 'playersCount_desc', label: 'По популярности' },
  { value: 'matchesCount_desc', label: 'По числу матчей' },
  { value: 'name_asc', label: 'По названию' },
];

type DeckSort = 'playersCount_desc' | 'matchesCount_desc' | 'name_asc';

function sortDecks(items: DeckListItem[], sort: DeckSort) {
  return [...items].sort((left, right) => {
    if (sort === 'name_asc') {
      return left.deck.name.localeCompare(right.deck.name, 'ru', {
        numeric: true,
        sensitivity: 'base',
      });
    }

    if (sort === 'matchesCount_desc') {
      const matchesDifference =
        (right.playedMatchesCount ?? right.matchesCount) -
        (left.playedMatchesCount ?? left.matchesCount);

      if (matchesDifference !== 0) return matchesDifference;
    } else {
      const popularityDifference = right.playersCount - left.playersCount;

      if (popularityDifference !== 0) return popularityDifference;
    }

    const tournamentsDifference = right.tournamentsCount - left.tournamentsCount;
    if (tournamentsDifference !== 0) return tournamentsDifference;

    return left.deck.name.localeCompare(right.deck.name, 'ru', {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

function getDeckSearchResultText(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `найдено ${count} колод`;
  }

  if (lastDigit === 1) {
    return `найдена ${count} колода`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `найдено ${count} колоды`;
  }

  return `найдено ${count} колод`;
}

export function DecksPage() {
  const { filters, apiFilters, setFilters, resetFilters, searchParams, updateQueryParams } = useDashboardFilters();
  const search = searchParams.get('search') || '';
  const requestedSort = searchParams.get('sort');
  const sort: DeckSort =
    requestedSort === 'matchesCount_desc' || requestedSort === 'name_asc'
      ? requestedSort
      : 'playersCount_desc';
  const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU');
  const isSearchMode = normalizedSearch.length > 0;
  const [visibleSearchCount, setVisibleSearchCount] = useState(LIST_PAGE_SIZE);
  const filtersKey = JSON.stringify(apiFilters);

  useEffect(() => {
    setVisibleSearchCount(LIST_PAGE_SIZE);
  }, [filtersKey, normalizedSearch, sort]);

  const sortLabelMap = {
    playersCount_desc: 'по популярности',
    matchesCount_desc: 'по количеству матчей',
    name_asc: 'по названию',
  } as const;
  const decksQuery = useInfiniteQuery({
    queryKey: ['decks', apiFilters, search, sort],
    queryFn: ({ pageParam }) =>
      getDecks({ ...apiFilters, search: search || undefined, sort, page: pageParam, limit: LIST_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const deckInsightsQuery = useQuery({
    queryKey: ['deck-list-insights', apiFilters],
    queryFn: () =>
      getAllDecks({
        ...apiFilters,
        sort: 'playersCount_desc',
      }),
  });
  const firstPage = decksQuery.data?.pages[0];
  const loadedDecks = decksQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const filteredDecks = useMemo(() => {
    const allDecks = deckInsightsQuery.data ?? [];
    const matchingDecks = isSearchMode
      ? allDecks.filter((item) =>
          item.deck.name.toLocaleLowerCase('ru-RU').includes(normalizedSearch),
        )
      : allDecks;

    return sortDecks(matchingDecks, sort);
  }, [deckInsightsQuery.data, isSearchMode, normalizedSearch, sort]);
  const decks = isSearchMode
    ? filteredDecks.slice(0, visibleSearchCount)
    : loadedDecks;
  const totalCount = isSearchMode
    ? filteredDecks.length
    : firstPage?.pagination.total ?? 0;
  const hasInitialData = isSearchMode
    ? deckInsightsQuery.isSuccess
    : Boolean(firstPage);
  const isInitialLoading = isSearchMode
    ? deckInsightsQuery.isLoading
    : decksQuery.isLoading;
  const isInitialError = isSearchMode
    ? deckInsightsQuery.isError
    : decksQuery.isError;
  const deckInsights = getDeckListInsights(filteredDecks);

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

      {!hasInitialData && isInitialLoading ? <LoadingState description="Собираем статистику по колодам." /> : null}
      {!hasInitialData && isInitialError ? (
        <ErrorState
          description={getErrorMessage(
            isSearchMode ? deckInsightsQuery.error : decksQuery.error,
            'Не получилось загрузить список колод. Попробуйте обновить страницу или изменить фильтры.',
          )}
          onRetry={() => {
            if (isSearchMode) {
              void deckInsightsQuery.refetch();
            } else {
              void decksQuery.refetch();
            }
          }}
        />
      ) : null}

      {hasInitialData ? totalCount === 0 ? (
        <EmptyState
          description={
            search
              ? 'Попробуйте изменить запрос или сбросить фильтры.'
              : 'Попробуйте изменить или сбросить выбранные фильтры.'
          }
          title={search ? 'Колоды по этому запросу не найдены' : 'По этим фильтрам нет колод'}
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
                  {isSearchMode
                    ? `Сводка построена только по колодам, найденным по запросу «${search.trim()}».`
                    : 'Сводка строится по всем колодам из текущей выборки и не зависит от сортировки или загруженной страницы.'}
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{totalCount}</div>
                <div className="insights-summary__title">колод найдено</div>
                <p className="insights-summary__description">
                  Таблица отсортирована {sortLabelMap[sort]}. Для сравнения результатов
                  нужно минимум 30 матчей в 10 турнирах.
                </p>
              </div>

              <div className="insights-list">
                {!isSearchMode && deckInsightsQuery.isLoading ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Собираем ориентир</div>
                    <div className="insight-item__body">
                      Загружаем все страницы колод по текущим фильтрам.
                    </div>
                  </article>
                ) : null}
                {!isSearchMode && deckInsightsQuery.isError ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Ориентир временно недоступен</div>
                    <div className="insight-item__body">
                      Не получилось собрать общую статистику. Таблица колод ниже
                      продолжает работать.
                    </div>
                  </article>
                ) : null}

                {deckInsights.mostPopularDeck ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Самая популярная колода</div>
                    <div className="insight-item__body">
                      <EntityLink
                        colors={deckInsights.mostPopularDeck.deck.colors}
                        id={deckInsights.mostPopularDeck.deck.id}
                        name={deckInsights.mostPopularDeck.deck.name}
                        type="deck"
                      />{' '}
                      встретилась {deckInsights.mostPopularDeck.playersCount} раз в{' '}
                      {deckInsights.mostPopularDeck.tournamentsCount} турнирах.
                    </div>
                  </article>
                ) : null}

                {deckInsights.bestEstablishedDeck ? (
                  <article className="insight-item">
                    <div className="insight-item__title">
                      Лучший результат на достаточной выборке
                    </div>
                    <div className="insight-item__body">
                      <EntityLink
                        colors={deckInsights.bestEstablishedDeck.deck.colors}
                        id={deckInsights.bestEstablishedDeck.deck.id}
                        name={deckInsights.bestEstablishedDeck.deck.name}
                        type="deck"
                      />{' '}
                      — {formatPercent(deckInsights.bestEstablishedDeck.matchWinRate)} побед,
                      результат{' '}
                      {formatRecord(
                        deckInsights.bestEstablishedDeck.matchWins,
                        deckInsights.bestEstablishedDeck.matchLosses,
                        deckInsights.bestEstablishedDeck.matchDraws,
                      )}{' '}
                      за {deckInsights.bestEstablishedDeck.matchesCount} матчей в{' '}
                      {deckInsights.bestEstablishedDeck.tournamentsCount} турнирах.
                    </div>
                  </article>
                ) : null}

                {deckInsightsQuery.isSuccess ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Достаточная выборка</div>
                    <div className="insight-item__body">
                      Порог 30 матчей в 10 турнирах прошли{' '}
                      {deckInsights.establishedDecksCount} из {totalCount} колод.
                    </div>
                  </article>
                ) : null}
              </div>
            </div>
          </Card>

          {deckInsightsQuery.isSuccess ? (
            <>
              <DeckActivityOverview insights={deckInsights} />
              <EstablishedDeckResults items={deckInsights.establishedDecks} />
            </>
          ) : null}

          <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">
                  {isSearchMode ? 'Результаты поиска' : 'Все колоды'}
                </h2>
                <p className="section-header__description">
                  {isSearchMode
                    ? `По запросу «${search.trim()}» ${getDeckSearchResultText(totalCount)}.`
                    : `Найдено ${totalCount} колод.`}{' '}
                  Нажмите на колоду, чтобы открыть турниры, игроков и матчапы.
                  По умолчанию первыми идут самые популярные колоды.
                </p>
              </div>
            </div>
            <Table
              columns={columns}
              data={decks}
              emptyMessage={search ? 'По этому запросу колоды не найдены.' : 'По этим фильтрам пока нет колод.'}
              getRowKey={(row) => row.deck.id}
              minWidth={980}
            />
            <LoadMorePagination
              hasMore={
                isSearchMode
                  ? decks.length < totalCount
                  : decksQuery.hasNextPage
              }
              isError={!isSearchMode && decksQuery.isFetchNextPageError}
              isLoading={!isSearchMode && decksQuery.isFetchingNextPage}
              loadedCount={decks.length}
              onLoadMore={() => {
                if (isSearchMode) {
                  setVisibleSearchCount((count) => count + LIST_PAGE_SIZE);
                } else {
                  void decksQuery.fetchNextPage();
                }
              }}
              totalCount={totalCount}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
