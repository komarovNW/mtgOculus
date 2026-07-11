import { useQuery } from '@tanstack/react-query';
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
        description="Здесь удобно сравнивать популярность колод, их результаты и быстро переходить к матчапам и турнирам."
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
            label="Как упорядочить список"
            onChange={(event) => updateQueryParams({ sort: event.target.value })}
            options={sortOptions}
            value={sort}
          />
        </div>
      </Card>

      {decksQuery.isLoading ? <LoadingState description="Загружаем статистику колод." /> : null}
      {decksQuery.isError ? (
        <ErrorState
          description={getErrorMessage(decksQuery.error, 'Попробуйте обновить страницу или изменить фильтры.')}
          onRetry={() => {
            void decksQuery.refetch();
          }}
        />
      ) : null}

      {decksQuery.isSuccess ? (
        <>
          <Card
            className="insights-card"
            tone="muted"
          >
            <div className="section-header">
              <div>
                <h2 className="section-header__title">Как смотреть на колоды</h2>
                <p className="section-header__description">
                  Сначала смотрите, чем играют чаще всего и какие колоды уже набрали матчи, а затем открывайте нужную
                  колоду для турниров, игроков и матчапов.
                </p>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insights-summary">
                <div className="insights-summary__value">{decksQuery.data.pagination.total}</div>
                <div className="insights-summary__title">колод найдено</div>
                <p className="insights-summary__description">
                  Сортировку можно менять в один клик: отдельно по популярности, результатам или лучшему месту.
                </p>
              </div>

              <div className="insights-list">
                {decksQuery.data.items.length > 0 ? (
                  <article className="insight-item">
                    <div className="insight-item__title">Самая популярная колода</div>
                    <div className="insight-item__body">
                      {(() => {
                        const popularDeck = [...decksQuery.data.items].sort(
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

                {decksQuery.data.items.length > 0 ? (
                  <article className="insight-item">
                    <div className="insight-item__title">По результатам выделяется</div>
                    <div className="insight-item__body">
                      {(() => {
                        const bestStableDeck =
                          [...decksQuery.data.items]
                            .filter((item) => !item.isSmallSample)
                            .sort(
                              (left, right) =>
                                right.matchWinRate - left.matchWinRate || right.matchesCount - left.matchesCount,
                            )[0] ?? decksQuery.data.items[0];

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
                  <div className="insight-item__title">Насколько надёжна выборка</div>
                  <div className="insight-item__body">
                    У {decksQuery.data.items.filter((item) => !item.isSmallSample).length} колод уже хватает матчей, чтобы
                    процент побед читался увереннее.
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
                  Найдено {decksQuery.data.pagination.total} колод. Нажмите на колоду, чтобы открыть результаты по
                  турнирам, игроков и матчапы.
                </p>
              </div>
            </div>
            <Table
              columns={columns}
              data={decksQuery.data.items}
              emptyMessage="По этим фильтрам пока нет колод."
              getRowKey={(row) => row.deck.id}
              minWidth={1100}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
