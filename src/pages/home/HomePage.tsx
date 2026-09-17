import { useQuery } from '@tanstack/react-query';
import { getDecks } from '@/entities/deck/api';
import { getAllPlayers } from '@/entities/player/api';
import { getHomeData } from '@/entities/tournament/api';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import { getPlayerRating } from '@/shared/lib/establishedPlayers';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { DeckMetagameSection } from '@/widgets/deck-metagame/DeckMetagameSection';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { HomeOverview } from '@/widgets/home-overview/HomeOverview';
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
      getAllPlayers({
        ...apiFilters,
        sort: 'matchesCount',
        order: 'desc',
      }, { signal }),
  });
  const deckFormatsQuery = useQuery({
    enabled: hasActiveFilters && !hasSelectedFormat,
    queryKey: ['home', 'deck-formats', apiFilters],
    queryFn: ({ signal }) =>
      getDecks({
        ...apiFilters,
        sort: 'playersCount_desc',
        page: 1,
        limit: 8,
      }, { signal }),
  });

  const appliedLabels = getAppliedFilterLabels(homeQuery.data?.appliedFilters);
  const appliedFilters = homeQuery.data?.appliedFilters;
  const formatLabel = filters.formatId
    ? (appliedFilters?.format?.name ?? (filters.formatId === 'legacy' ? 'Legacy' : 'Выбранный формат'))
    : 'Все форматы';
  const selectedCityName = appliedFilters?.city?.name ?? (filters.cityId === 'moscow' ? 'Москва' : undefined);
  const cityTitle = selectedCityName === 'Москва' ? 'Москве' : selectedCityName;
  const homeTitle = !filters.formatId && !filters.cityId
    ? 'Все форматы · все города'
    : !filters.formatId
      ? `Все форматы в ${cityTitle ?? 'выбранном городе'}`
      : !filters.cityId
        ? `${formatLabel} · все города`
        : `${formatLabel} в ${cityTitle ?? 'выбранном городе'}`;
  const eventCountTitle = filters.tournamentType === 'daily'
    ? 'Дейликов'
    : filters.tournamentType === 'tournament'
      ? 'Турниров'
      : 'Дейликов и турниров';
  const emptyEventTitle = filters.tournamentType === 'daily'
    ? 'Пока нет дейликов'
    : filters.tournamentType === 'tournament'
      ? 'Пока нет турниров'
      : 'Пока нет дейликов и турниров';
  const emptyEventDescription = filters.tournamentType === 'daily'
    ? 'Когда появятся загруженные дейлики, здесь покажем колоды, игроков и матчапы.'
    : filters.tournamentType === 'tournament'
      ? 'Когда появятся загруженные турниры, здесь покажем колоды, игроков и матчапы.'
      : 'Когда появятся загруженные дейлики или турниры, здесь покажем колоды, игроков и матчапы.';
  const recentDailies = homeQuery.data?.recentTournaments.filter((item) => item.type === 'daily') ?? [];
  const recentTournaments = homeQuery.data?.recentTournaments.filter((item) => item.type === 'tournament') ?? [];
  const deckFormatById = new Map(
    (deckFormatsQuery.data?.items ?? []).map((item) => [item.deck.id, item.format]),
  );
  const deckMetagame = (homeQuery.data?.deckMetagame ?? []).map((item) => ({
    ...item,
    format: hasSelectedFormat ? appliedFilters?.format ?? undefined : deckFormatById.get(item.deck.id),
  }));
  const playerRating = establishedPlayersQuery.data
    ? getPlayerRating(establishedPlayersQuery.data)
    : undefined;

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          ...appliedLabels.map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description={!hasActiveFilters
          ? 'Общий объём загруженной статистики и последние события.'
          : hasSelectedFormat
            ? 'Метагейм, результаты колод, игроки и матчапы.'
            : 'Игроки и последние события.'}
        eyebrow="Статистика по загруженным событиям"
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
              { title: eventCountTitle, value: homeQuery.data.summary.tournamentsCount },
              {
                title: 'Уникальных игроков',
                value: homeQuery.data.summary.uniquePlayersCount,
              },
              {
                title: 'Матчей в статистике',
                value: homeQuery.data.summary.matchesCount,
              },
            ]}
          />

          {homeQuery.data.summary.tournamentsCount === 0 ? (
            <EmptyState
              description={emptyEventDescription}
              title={emptyEventTitle}
            />
          ) : (
            <>
              {!hasActiveFilters && homeQuery.data.overview ? (
                <HomeOverview overview={homeQuery.data.overview} />
              ) : null}
              {hasActiveFilters ? (
                <>
                  <DeckMetagameSection
                    actionHref="/decks"
                    items={deckMetagame}
                    performanceItems={homeQuery.data.deckPerformance}
                    limit={8}
                    showFormat={!hasSelectedFormat}
                  />
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
                      fieldWinRate={playerRating?.fieldWinRate ?? 0}
                      items={playerRating?.players ?? []}
                      limit={10}
                      minimumMatches={playerRating?.minimumMatches ?? 0}
                      showSpotlight
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
                actionHref="/dailies"
                actionLabel="Смотреть все дейлики"
                compact
                emptyMessage="Пока нет дейликов по этим фильтрам."
                itemLabel="Дейлик"
                items={recentDailies}
                limit={5}
                showFormat={!hasSelectedFormat}
                title="Последние дейлики"
              />
              <RecentTournamentsTable
                actionHref="/tournaments"
                compact
                emptyCallout="ВИТАЛЯ ДОДЕЛАЙ ТУРНИРЫ."
                emptyMessage="Турниры пока не загружены."
                items={recentTournaments}
                limit={5}
                showFormat={!hasSelectedFormat}
              />
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
