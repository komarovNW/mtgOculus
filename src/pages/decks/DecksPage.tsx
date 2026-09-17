import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getDecks } from '@/entities/deck/api';
import { allDecksQueryOptions } from '@/entities/deck/queries';
import { useAppliedFilters } from '@/entities/dictionaries/useAppliedFilters';
import type { DashboardFilters, DeckListItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import {
  ESTABLISHED_DECK_SAMPLE_HINT,
  isEstablishedDeck,
} from '@/shared/lib/establishedDecks';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
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
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';

function getColumns(tournamentType: DashboardFilters['tournamentType']): TableColumn<DeckListItem>[] {
  const eventsLabel = tournamentType === 'daily'
    ? 'Дейликов'
    : tournamentType === 'tournament'
      ? 'Турниров'
      : 'Дейлики / турниры';
  const participationsLabel = tournamentType === 'daily'
    ? 'Участий в дейликах'
    : tournamentType === 'tournament'
      ? 'Участий в турнирах'
      : 'Участий';
  const participationsHint = tournamentType === 'daily'
    ? 'Сколько раз этой колодой играли на дейликах.'
    : tournamentType === 'tournament'
      ? 'Сколько раз этой колодой играли на турнирах.'
      : 'Сколько раз этой колодой играли на дейликах и турнирах.';

  return [
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
              Мало данных
            </Badge>
          ) : null}
        </div>
      ),
    },
    { id: 'format', header: 'Формат', render: (row) => <Badge>{row.format.name}</Badge> },
    {
      id: 'tournaments',
      header: eventsLabel,
      align: 'center',
      render: (row) => row.tournamentsCount,
    },
    {
      id: 'players',
      header: participationsLabel,
      align: 'center',
      headerTitle: participationsHint,
      render: (row) => row.playersCount,
    },
    {
      id: 'matches',
      header: 'Сыграно матчей',
      align: 'center',
      render: (row) => row.playedMatchesCount,
    },
    {
      id: 'record',
      header: MATCH_RECORD_LABEL,
      align: 'center',
      headerTitle: MATCH_RECORD_HINT,
      render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
    },
    {
      id: 'winrate',
      header: WIN_RATE_LABEL,
      align: 'center',
      headerTitle: WIN_RATE_HINT,
      render: (row) => formatPercent(row.matchWinRate),
    },
  ];
}

const sortOptions = [
  { value: 'playersCount_desc', label: 'По числу участий' },
  { value: 'matchesCount_desc', label: 'По числу матчей' },
  { value: 'winRate_desc', label: 'По проценту побед' },
  { value: 'name_asc', label: 'По названию' },
];

type DeckSort =
  | 'playersCount_desc'
  | 'matchesCount_desc'
  | 'winRate_desc'
  | 'name_asc';

function sortDecks(items: DeckListItem[], sort: DeckSort) {
  return [...items].sort((left, right) => {
    if (sort === 'name_asc') {
      return left.deck.name.localeCompare(right.deck.name, 'ru', {
        numeric: true,
        sensitivity: 'base',
      });
    }

    if (sort === 'winRate_desc') {
      const sampleDifference =
        Number(isEstablishedDeck(right)) - Number(isEstablishedDeck(left));

      if (sampleDifference !== 0) return sampleDifference;

      const winRateDifference = right.matchWinRate - left.matchWinRate;
      if (winRateDifference !== 0) return winRateDifference;

      const matchesDifference =
        right.playedMatchesCount - left.playedMatchesCount;
      if (matchesDifference !== 0) return matchesDifference;
    } else if (sort === 'matchesCount_desc') {
      const matchesDifference =
        right.playedMatchesCount - left.playedMatchesCount;

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
    requestedSort === 'matchesCount_desc' ||
    requestedSort === 'winRate_desc' ||
    requestedSort === 'name_asc'
      ? requestedSort
      : 'playersCount_desc';
  const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU');
  const isSearchMode = normalizedSearch.length > 0;
  const useClientList = isSearchMode || sort === 'winRate_desc';
  const serverSort =
    sort === 'winRate_desc' ? 'playersCount_desc' : sort;
  const [visibleClientCount, setVisibleClientCount] = useState(LIST_PAGE_SIZE);
  const filtersKey = JSON.stringify(apiFilters);

  useEffect(() => {
    setVisibleClientCount(LIST_PAGE_SIZE);
  }, [filtersKey, normalizedSearch, sort]);

  const sortLabelMap = {
    playersCount_desc: 'числу участий',
    matchesCount_desc: 'числу матчей',
    winRate_desc: 'проценту побед среди колод с достаточным числом матчей',
    name_asc: 'названию',
  } as const;
  const decksQuery = useInfiniteQuery({
    enabled: !useClientList,
    queryKey: ['decks', apiFilters, sort],
    queryFn: ({ pageParam, signal }) =>
      getDecks({
        ...apiFilters,
        sort: serverSort,
        page: pageParam,
        limit: LIST_PAGE_SIZE,
      }, { signal }),
    initialPageParam: 1,
    getNextPageParam,
  });
  const deckInsightsQuery = useQuery({
    ...allDecksQueryOptions(apiFilters),
    enabled: useClientList,
  });
  const firstPage = decksQuery.data?.pages[0];
  const appliedFilters = useAppliedFilters(apiFilters, firstPage?.appliedFilters);
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
  const decks = useClientList
    ? filteredDecks.slice(0, visibleClientCount)
    : loadedDecks;
  const totalCount = useClientList
    ? filteredDecks.length
    : firstPage?.pagination.total ?? 0;
  const hasInitialData = useClientList
    ? deckInsightsQuery.isSuccess
    : Boolean(firstPage);
  const isInitialLoading = useClientList
    ? deckInsightsQuery.isLoading
    : decksQuery.isLoading;
  const isInitialError = useClientList
    ? deckInsightsQuery.isError
    : decksQuery.isError;
  const columns = getColumns(filters.tournamentType);
  const visibleColumns = filters.formatId
    ? columns.filter((column) => column.id !== 'format')
    : columns;
  const eventScope = filters.tournamentType === 'daily'
    ? 'на дейликах'
    : filters.tournamentType === 'tournament'
      ? 'на турнирах'
      : 'на дейликах и турнирах';
  const deckCountText = getDeckSearchResultText(totalCount);

  return (
    <div className="page-stack">
      <PageHeader
        badges={getAppliedFilterLabels(appliedFilters).map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        description={`Сравните популярность и результаты колод ${eventScope}.`}
        eyebrow="Статистика колод"
        title="Колоды"
      />

      <FiltersPanel
        collapsible
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
            useClientList ? deckInsightsQuery.error : decksQuery.error,
            'Не получилось загрузить список колод. Попробуйте обновить страницу или изменить фильтры.',
          )}
          onRetry={() => {
            if (useClientList) {
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
        <Card>
            <div className="section-header">
              <div>
                <h2 className="section-header__title">
                  {isSearchMode ? 'Результаты поиска' : 'Список колод'}
                </h2>
                <p className="section-header__description">
                  {isSearchMode
                    ? `По запросу «${search.trim()}» ${getDeckSearchResultText(totalCount)}.`
                    : `${deckCountText.charAt(0).toUpperCase()}${deckCountText.slice(1)}, сортировка по ${sortLabelMap[sort]}.`}
                </p>
              </div>
            </div>
            <Table
              columns={visibleColumns}
              data={decks}
              emptyMessage={search ? 'По этому запросу колоды не найдены.' : 'По этим фильтрам пока нет колод.'}
              getRowKey={(row) => row.deck.id}
              minWidth={filters.formatId ? 860 : 980}
            />
            <LoadMorePagination
              hasMore={
                useClientList
                  ? decks.length < totalCount
                  : decksQuery.hasNextPage
              }
              isError={!useClientList && decksQuery.isFetchNextPageError}
              isLoading={!useClientList && decksQuery.isFetchingNextPage}
              loadedCount={decks.length}
              onLoadMore={() => {
                if (useClientList) {
                  setVisibleClientCount((count) => count + LIST_PAGE_SIZE);
                } else {
                  void decksQuery.fetchNextPage();
                }
              }}
              totalCount={totalCount}
            />
          </Card>
      ) : null}
    </div>
  );
}
