import { useQuery } from '@tanstack/react-query';
import { getHomeData } from '@/entities/tournament/api';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
import { TOURNAMENT_PARTICIPATIONS_HINT, TOURNAMENT_PARTICIPATIONS_LABEL } from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { DeckMetagameSection } from '@/widgets/deck-metagame/DeckMetagameSection';
import { DeckPerformanceTable } from '@/widgets/deck-performance/DeckPerformanceTable';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { HomeHighlights } from '@/widgets/home-highlights/HomeHighlights';
import { PopularMatchupsTable } from '@/widgets/popular-matchups/PopularMatchupsTable';
import { RecentTournamentsTable } from '@/widgets/recent-tournaments/RecentTournamentsTable';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';
import { TopPlayersTable } from '@/widgets/top-players/TopPlayersTable';

export function HomePage() {
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const homeQuery = useQuery({
    queryKey: ['home', apiFilters],
    queryFn: () => getHomeData(apiFilters),
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
  const periodLabel =
    appliedFilters?.dateFrom || appliedFilters?.dateTo
      ? `Период: ${appliedFilters?.dateFrom ? formatDate(appliedFilters.dateFrom) : '—'} - ${
          appliedFilters?.dateTo ? formatDate(appliedFilters.dateTo) : '—'
        }`
      : 'За все загруженные турниры';
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
        description="Собрали метагейм, результаты колод, лучших игроков и частые матчапы по этим фильтрам."
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
                title: TOURNAMENT_PARTICIPATIONS_LABEL,
                titleHint: TOURNAMENT_PARTICIPATIONS_HINT,
                value: homeQuery.data.summary.tournamentPlayersCount,
                subtitle: periodLabel,
              },
              {
                title: 'Уникальных игроков',
                value: homeQuery.data.summary.uniquePlayersCount,
                subtitle: 'Сколько разных игроков попало в эту статистику',
              },
              { title: 'Матчей', value: homeQuery.data.summary.matchesCount, subtitle: 'Все матчи из загруженных турниров' },
              {
                title: 'Уникальных колод',
                value: homeQuery.data.summary.uniqueDecksCount,
                subtitle: 'Сколько разных колод встретилось в этой статистике',
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
              <HomeHighlights
                deckMetagame={homeQuery.data.deckMetagame}
                deckPerformance={homeQuery.data.deckPerformance}
                recentTournaments={homeQuery.data.recentTournaments}
                summary={homeQuery.data.summary}
                topPlayers={homeQuery.data.topPlayers}
              />
              <DeckMetagameSection
                actionHref="/decks"
                items={homeQuery.data.deckMetagame}
                limit={10}
              />
              <DeckPerformanceTable
                actionHref="/decks"
                items={homeQuery.data.deckPerformance}
                limit={10}
              />
              <TopPlayersTable
                actionHref="/players"
                items={homeQuery.data.topPlayers}
                limit={10}
                showSpotlight
              />
              <PopularMatchupsTable
                expandable
                initialLimit={5}
                items={homeQuery.data.popularMatchups}
              />
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
