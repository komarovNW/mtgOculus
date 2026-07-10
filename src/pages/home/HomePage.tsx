import { useQuery } from '@tanstack/react-query';
import { env } from '@/shared/config/env';
import { getHomeData } from '@/entities/tournament/api';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { formatDate } from '@/shared/lib/formatDate';
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

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge
            key="mode"
            variant={env.useMocks ? 'warning' : 'accent'}
          >
            {env.useMocks ? 'Mock mode' : 'API mode'}
          </Badge>,
          ...appliedLabels.map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description={`Публичный аналитический dashboard по загруженным турнирам Magic: The Gathering. Текущий срез: ${sliceLabel}. ${periodLabel}.`}
        eyebrow="Главный экран"
        title="Magic Oculus"
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {homeQuery.isLoading ? <LoadingState /> : null}

      {homeQuery.isError ? (
        <ErrorState
          description={getErrorMessage(homeQuery.error, 'Попробуйте обновить страницу или сменить фильтры.')}
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
              { title: 'Игроко-участий', value: homeQuery.data.summary.tournamentPlayersCount, subtitle: periodLabel },
              { title: 'Уникальных игроков', value: homeQuery.data.summary.uniquePlayersCount, subtitle: 'Активны в текущем срезе' },
              { title: 'Матчей', value: homeQuery.data.summary.matchesCount, subtitle: 'Все сыгранные раунды' },
              { title: 'Уникальных колод', value: homeQuery.data.summary.uniqueDecksCount, subtitle: 'Архетипы в базе среза' },
            ]}
          />

          {homeQuery.data.summary.tournamentsCount === 0 ? (
            <EmptyState description="Пока нет загруженных турниров по выбранным фильтрам." />
          ) : (
            <>
              <RecentTournamentsTable items={homeQuery.data.recentTournaments} />
              <DeckMetagameSection items={homeQuery.data.deckMetagame} />
              <DeckPerformanceTable items={homeQuery.data.deckPerformance} />
              <TopPlayersTable items={homeQuery.data.topPlayers} />
              <PopularMatchupsTable items={homeQuery.data.popularMatchups} />
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
