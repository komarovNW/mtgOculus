import { useQuery } from '@tanstack/react-query';
import { env } from '@/shared/config/env';
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
  const sliceLabel = [
    appliedFilters?.format?.name ?? 'Legacy',
    appliedFilters?.city?.name ?? 'Москва',
    appliedFilters?.club?.name ?? 'Все клубы',
  ].join(' · ');
  const periodLabel =
    appliedFilters?.dateFrom || appliedFilters?.dateTo
      ? `Период: ${appliedFilters?.dateFrom ? formatDate(appliedFilters.dateFrom) : '—'} - ${
          appliedFilters?.dateTo ? formatDate(appliedFilters.dateTo) : '—'
        }`
      : 'Весь доступный период';
  const cityTitle = appliedFilters?.city?.name === 'Москва' ? 'Москве' : appliedFilters?.city?.name ?? 'Москве';
  const homeTitle = `${appliedFilters?.format?.name ?? 'Legacy'} в ${cityTitle}`;

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge
            key="mode"
            variant={env.useMocks ? 'warning' : 'accent'}
          >
            {env.useMocks ? 'Демо-данные' : 'Живые данные'}
          </Badge>,
          ...appliedLabels.map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description="Смотрим метагейм, результаты колод, лучших игроков и частые матчапы по выбранным фильтрам."
        eyebrow="Статистика по загруженным турнирам"
        title={homeTitle}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {homeQuery.isLoading ? <LoadingState description="Загружаем статистику по выбранным фильтрам." /> : null}

      {homeQuery.isError ? (
        <ErrorState
          description={getErrorMessage(homeQuery.error, 'Попробуйте обновить страницу или изменить фильтры.')}
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
                subtitle: 'Сколько разных игроков было в турнирах по этим фильтрам',
              },
              { title: 'Матчей', value: homeQuery.data.summary.matchesCount, subtitle: 'Все сыгранные матчи в загруженных турнирах' },
              {
                title: 'Уникальных колод',
                value: homeQuery.data.summary.uniqueDecksCount,
                subtitle: 'Сколько разных колод встретилось в турнирах по этим фильтрам',
              },
            ]}
          />

          {homeQuery.data.summary.tournamentsCount === 0 ? (
            <EmptyState
              description="Когда появятся загруженные турниры, здесь будет статистика по колодам, игрокам и матчапам."
              title="Пока нет турниров по выбранным фильтрам"
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
