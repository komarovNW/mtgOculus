import { useQuery } from '@tanstack/react-query';
import { getPlayers } from '@/entities/player/api';
import { getHomeData } from '@/entities/tournament/api';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { getEstablishedPlayers } from '@/shared/lib/establishedPlayers';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { DeckMetagameSection } from '@/widgets/deck-metagame/DeckMetagameSection';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { PopularMatchupsTable } from '@/widgets/popular-matchups/PopularMatchupsTable';
import { RecentTournamentsTable } from '@/widgets/recent-tournaments/RecentTournamentsTable';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';
import { TopPlayersTable } from '@/widgets/top-players/TopPlayersTable';

export function HomePage() {
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const hasSelectedFormat = Boolean(filters.formatId);
  const homeQuery = useQuery({
    queryKey: ['home', apiFilters],
    queryFn: ({ signal }) => getHomeData(apiFilters, { signal }),
  });
  const establishedPlayersQuery = useQuery({
    enabled: hasActiveFilters,
    queryKey: ['home', 'established-players', apiFilters],
    queryFn: ({ signal }) =>
      getPlayers({
        ...apiFilters,
        sort: 'matchesCount',
        order: 'desc',
        page: 1,
        limit: 100,
      }, { signal }),
  });

  const appliedLabels = getAppliedFilterLabels(homeQuery.data?.appliedFilters);
  const appliedFilters = homeQuery.data?.appliedFilters;
  const formatLabel = filters.formatId
    ? (appliedFilters?.format?.name ?? (filters.formatId === 'legacy' ? 'Legacy' : 'Выбранный формат'))
    : 'Все форматы';
  const cityLabel = filters.cityId
    ? (appliedFilters?.city?.name ?? (filters.cityId === 'moscow' ? 'Москва' : 'Выбранный город'))
    : 'Все города';
  const sliceLabel = [
    formatLabel,
    cityLabel,
    appliedFilters?.club?.name ?? 'Все клубы',
  ].join(' · ');
  const selectedCityName = appliedFilters?.city?.name ?? (filters.cityId === 'moscow' ? 'Москва' : undefined);
  const cityTitle = selectedCityName === 'Москва' ? 'Москве' : selectedCityName;
  const homeTitle = !filters.formatId && !filters.cityId
    ? 'Все форматы · все города'
    : !filters.formatId
      ? `Все форматы в ${cityTitle ?? 'выбранном городе'}`
      : !filters.cityId
        ? `${formatLabel} · все города`
        : `${formatLabel} в ${cityTitle ?? 'выбранном городе'}`;

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          ...appliedLabels.map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description={!hasActiveFilters
          ? 'Общий объём загруженной статистики и последние турниры.'
          : hasSelectedFormat
            ? 'Метагейм, результаты колод, игроки и матчапы.'
            : 'Игроки и последние турниры по выбранным фильтрам.'}
        eyebrow="Статистика по загруженным турнирам"
        title={homeTitle}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {homeQuery.isLoading ? <LoadingState description="Собираем статистику по этим фильтрам." /> : null}

      {homeQuery.isError ? (
        <ErrorState
          description={getErrorMessage(homeQuery.error, 'Не получилось загрузить статистику. Попробуйте обновить страницу или изменить фильтры.')}
          onRetry={() => {
            void homeQuery.refetch();
          }}
        />
      ) : null}

      {homeQuery.isSuccess ? (
        <>
          <SummaryCards
            items={[
              { title: 'Турниров', value: homeQuery.data.summary.tournamentsCount, subtitle: sliceLabel },
              {
                title: 'Уникальных игроков',
                value: homeQuery.data.summary.uniquePlayersCount,
                subtitle: 'В текущей выборке',
              },
              {
                title: 'Матчей в статистике',
                value: homeQuery.data.summary.matchesCount,
                subtitle: 'В текущей выборке',
              },
            ]}
          />

          {homeQuery.data.summary.tournamentsCount === 0 ? (
            <EmptyState
              description="Когда появятся загруженные турниры, здесь сразу покажем колоды, игроков и матчапы."
              title="Пока нет турниров по этим фильтрам"
            />
          ) : (
            <>
              {hasActiveFilters ? (
                <>
                  {hasSelectedFormat ? (
                    <DeckMetagameSection
                      actionHref="/decks"
                      items={homeQuery.data.deckMetagame}
                      performanceItems={homeQuery.data.deckPerformance}
                      limit={8}
                    />
                  ) : null}
                  {establishedPlayersQuery.isLoading ? (
                    <LoadingState description="Собираем результаты активных игроков." />
                  ) : null}
                  {establishedPlayersQuery.isError ? (
                    <ErrorState
                      description={getErrorMessage(
                        establishedPlayersQuery.error,
                        'Не получилось загрузить результаты активных игроков.',
                      )}
                      onRetry={() => {
                        void establishedPlayersQuery.refetch();
                      }}
                    />
                  ) : null}
                  {establishedPlayersQuery.isSuccess ? (
                    <TopPlayersTable
                      actionHref="/players"
                      items={getEstablishedPlayers(establishedPlayersQuery.data.items)}
                      limit={10}
                      showSpotlight
                      scopeDescription={establishedPlayersQuery.data.pagination.hasMore
                        ? `Среди ${establishedPlayersQuery.data.items.length} самых активных игроков из ${establishedPlayersQuery.data.pagination.total} в выбранной статистике.`
                        : undefined}
                    />
                  ) : null}
                  {hasSelectedFormat ? (
                    <PopularMatchupsTable
                      expandable
                      initialLimit={5}
                      items={homeQuery.data.popularMatchups}
                    />
                  ) : null}
                </>
              ) : null}
              <RecentTournamentsTable
                actionHref="/tournaments"
                compact
                items={homeQuery.data.recentTournaments}
                limit={5}
              />
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
