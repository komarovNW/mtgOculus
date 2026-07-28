import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getAllDecks, getDeckDetails } from '@/entities/deck/api';
import type { DeckMatchupItem, DeckPlayerItem, TournamentDeckResultItem } from '@/shared/api/types';
import { getAppliedFilterLabels } from '@/shared/lib/appliedFilters';
import {
  ESTABLISHED_MATCHUP_MIN_MATCHES,
  getDeckDetailInsights,
  isEstablishedDeckPlayer,
  isEstablishedMatchup,
} from '@/shared/lib/deckDetailInsights';
import {
  ESTABLISHED_DECK_MIN_MATCHES,
  ESTABLISHED_DECK_MIN_TOURNAMENTS,
  ESTABLISHED_DECK_SAMPLE_HINT,
} from '@/shared/lib/establishedDecks';
import { ESTABLISHED_PLAYER_SAMPLE_HINT } from '@/shared/lib/establishedPlayers';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import {
  MATCH_RECORD_HINT,
  MATCH_RECORD_LABEL,
  TOURNAMENT_PARTICIPATIONS_HINT,
  TOURNAMENT_PARTICIPATIONS_LABEL,
  WIN_RATE_HINT,
  WIN_RATE_LABEL,
  formatRecord,
  getRecordSortValue,
  getRecordSortValueFromString,
} from '@/shared/lib/formatRecord';
import { useDashboardFilters } from '@/shared/lib/filters';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { LIST_PAGE_SIZE } from '@/shared/lib/pagination';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadMorePagination } from '@/shared/ui/LoadMorePagination';
import { LoadingState } from '@/shared/ui/LoadingState';
import { ManaPips } from '@/shared/ui/ManaPips';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { FiltersPanel } from '@/widgets/filters-panel/FiltersPanel';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';
import { DeckHistoryChart } from '@/widgets/deck-history/DeckHistoryChart';

const tournamentColumns: TableColumn<TournamentDeckResultItem>[] = [
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.tournament.date),
    sortValue: (row) => row.tournament.date,
  },
  {
    id: 'tournament',
    header: 'Турнир',
    sortValue: (row) => row.tournament.title,
    render: (row) => (
      <EntityLink
        id={row.tournament.id}
        name={row.tournament.title}
        type="tournament"
      />
    ),
  },
  {
    id: 'player',
    header: 'Игрок',
    sortValue: (row) => row.player.name,
    render: (row) => (
      <EntityLink
        id={row.player.id}
        name={row.player.name}
        type="player"
      />
    ),
  },
  {
    id: 'record',
    header: 'Результат',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => row.record,
    sortValue: (row) => getRecordSortValueFromString(row.record),
  },
  {
    id: 'finish',
    header: 'Итог',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => `${row.rank} из ${row.tournament.playersCount}`,
    sortValue: (row) => row.rank / Math.max(1, row.tournament.playersCount),
  },
];

const playerColumns: TableColumn<DeckPlayerItem>[] = [
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
        {!isEstablishedDeckPlayer(row) ? (
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
];

function getMatchupColumns(
  deckId: string,
  knownMatchupsCount: number,
): TableColumn<DeckMatchupItem>[] {
  return [
    {
      id: 'opponent',
      header: 'Против колоды',
      sortValue: (row) => row.opponentDeck.name,
      render: (row) => (
        <div className="entity-cell">
          <EntityLink
            colors={row.opponentDeck.colors}
            id={row.opponentDeck.id}
            name={row.opponentDeck.name}
            type="deck"
          />
          {row.opponentDeck.id === deckId ? <Badge>Зеркало</Badge> : null}
          {!isEstablishedMatchup(row) ? (
            <Badge
              title={`Для сравнения матчапов нужно минимум ${ESTABLISHED_MATCHUP_MIN_MATCHES} матчей.`}
              variant="warning"
            >
              Малая выборка
            </Badge>
          ) : null}
        </div>
      ),
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
      id: 'share',
      header: 'Доля известных встреч',
      align: 'right',
      defaultSortDirection: 'desc',
      render: (row) =>
        knownMatchupsCount > 0
          ? formatPercent((row.matchesCount / knownMatchupsCount) * 100)
          : '—',
      sortValue: (row) =>
        knownMatchupsCount > 0 ? row.matchesCount / knownMatchupsCount : 0,
    },
    {
      id: 'record',
      header: MATCH_RECORD_LABEL,
      align: 'right',
      defaultSortDirection: 'desc',
      headerTitle: MATCH_RECORD_HINT,
      render: (row) => formatRecord(row.wins, row.losses, row.draws),
      sortValue: (row) => getRecordSortValue(row.wins, row.losses, row.draws),
    },
    {
      id: 'winrate',
      header: WIN_RATE_LABEL,
      align: 'right',
      defaultSortDirection: 'desc',
      headerTitle: WIN_RATE_HINT,
      render: (row) => formatPercent(row.winRate),
      sortValue: (row) => row.winRate,
    },
  ];
}

export function DeckDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('results');
  const [visibleResultsCount, setVisibleResultsCount] = useState(LIST_PAGE_SIZE);
  const [visiblePlayersCount, setVisiblePlayersCount] = useState(LIST_PAGE_SIZE);
  const [visibleMatchupsCount, setVisibleMatchupsCount] = useState(LIST_PAGE_SIZE);
  const { filters, apiFilters, setFilters, resetFilters } = useDashboardFilters();
  const detailFilters = {
    ...apiFilters,
    formatId: undefined,
  };
  const deckQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['deck-detail', id, detailFilters],
    queryFn: () => getDeckDetails(id, detailFilters),
  });
  const deckFormatId = deckQuery.data?.deck.format.id;
  const metagameQuery = useQuery({
    enabled: Boolean(deckFormatId),
    queryKey: ['deck-detail-metagame', apiFilters, deckFormatId],
    queryFn: () =>
      getAllDecks({
        ...apiFilters,
        formatId: deckFormatId ?? '',
      }),
  });
  const filterKey = JSON.stringify(detailFilters);

  useEffect(() => {
    setVisibleResultsCount(LIST_PAGE_SIZE);
    setVisiblePlayersCount(LIST_PAGE_SIZE);
    setVisibleMatchupsCount(LIST_PAGE_SIZE);
  }, [filterKey, id]);

  if (deckQuery.isLoading) {
    return <LoadingState description="Собираем статистику по колоде." />;
  }

  if (deckQuery.isError || !deckQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(deckQuery.error, 'Не получилось открыть страницу колоды. Попробуйте обновить её и зайти ещё раз.')}
        onRetry={() => {
          void deckQuery.refetch();
        }}
        title="Не удалось открыть колоду"
      />
    );
  }

  const { deck, summary } = deckQuery.data;
  const insights = getDeckDetailInsights(deckQuery.data);
  const allDeckParticipations =
    metagameQuery.data?.reduce(
      (total, item) => total + item.playersCount,
      0,
    ) ?? 0;
  const metaShare =
    allDeckParticipations > 0
      ? (summary.playersCount / allDeckParticipations) * 100
      : null;
  const matchupComparisonMessage =
    insights.establishedMatchupsCount < 2
      ? `Для сравнения нужны хотя бы два незеркальных матчапа с ${ESTABLISHED_MATCHUP_MIN_MATCHES}+ матчами.`
      : 'У подтверждённых матчапов одинаковый процент побед — выделить лучший и худший пока нельзя.';
  const matchupColumns = getMatchupColumns(
    deck.id,
    insights.knownMatchupsCount,
  );
  const sortedTournamentResults = [...deckQuery.data.tournamentResults].sort(
    (left, right) =>
      right.tournament.date.localeCompare(left.tournament.date) ||
      right.tournament.id.localeCompare(left.tournament.id),
  );
  const sortedPlayers = [...deckQuery.data.players].sort(
    (left, right) =>
      right.matchesCount - left.matchesCount ||
      right.tournamentsCount - left.tournamentsCount ||
      left.player.name.localeCompare(right.player.name, 'ru'),
  );
  const sortedMatchups = deckQuery.data.matchups
    .filter(
      (item) =>
        item.hasKnownOpponentDeck !== false && Boolean(item.opponentDeck.id),
    )
    .sort(
      (left, right) =>
        right.matchesCount - left.matchesCount ||
        left.opponentDeck.name.localeCompare(right.opponentDeck.name, 'ru'),
    );
  const visibleTournamentResults = sortedTournamentResults.slice(
    0,
    visibleResultsCount,
  );
  const visiblePlayers = sortedPlayers.slice(0, visiblePlayersCount);
  const visibleMatchups = sortedMatchups.slice(0, visibleMatchupsCount);

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="format">{deck.format.name}</Badge>,
          ...(deck.colors?.length ? [<ManaPips key="colors" colors={deck.colors} />] : []),
          ...(!insights.isEstablished
            ? [
                <Badge
                  key="small-sample"
                  title={ESTABLISHED_DECK_SAMPLE_HINT}
                  variant="warning"
                >
                  Малая выборка
                </Badge>,
              ]
            : []),
          ...getAppliedFilterLabels(deckQuery.data.appliedFilters)
            .filter((label) => label !== deck.format.name)
            .map((label) => <Badge key={label}>{label}</Badge>),
        ]}
        description={
          deck.archetype
            ? `Показываем, как колода выступала в турнирах и против чего чаще всего играла. Архетип: ${deck.archetype}.`
            : 'Показываем, как колода выступала в турнирах и против чего чаще всего играла.'
        }
        eyebrow="Колода"
        title={deck.name}
      />

      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        showFormat={false}
      />

      <SummaryCards
        description="Коротко о результатах этой колоды по этим фильтрам."
        title="Общая статистика колоды"
        items={[
          { title: 'Турниров', value: summary.tournamentsCount },
          {
            title: TOURNAMENT_PARTICIPATIONS_LABEL,
            titleHint: TOURNAMENT_PARTICIPATIONS_HINT,
            value: summary.playersCount,
            subtitle: `Разных игроков: ${summary.uniquePlayersCount}`,
          },
          {
            title: 'Матчей против соперника',
            value: insights.playedMatchesCount,
            subtitle:
              insights.byesCount > 0
                ? `${insights.byesCount} BYE не влияет на статистику колоды`
                : 'BYE не влияет на эффективность колоды',
          },
          {
            title: MATCH_RECORD_LABEL,
            titleHint: MATCH_RECORD_HINT,
            value: formatRecord(summary.matchWins, summary.matchLosses, summary.matchDraws),
          },
          {
            title: WIN_RATE_LABEL,
            titleHint: WIN_RATE_HINT,
            value: formatPercent(summary.matchWinRate),
            subtitle: insights.isEstablished
              ? 'Достаточная выборка для сравнения'
              : `Нужно ${ESTABLISHED_DECK_MIN_MATCHES} матчей в ${ESTABLISHED_DECK_MIN_TOURNAMENTS} турнирах`,
          },
          {
            title: 'Доля метагейма',
            titleHint:
              'Доля всех участий колод в выбранном срезе, которая приходится на эту колоду.',
            value: metagameQuery.isLoading
              ? '…'
              : metaShare === null
                ? '—'
                : formatPercent(metaShare),
            subtitle: metagameQuery.isError
              ? 'Не удалось загрузить общий объём метагейма'
              : 'От всех участий колод по этим фильтрам',
          },
        ]}
      />

      <Card className="insights-card">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Главное о колоде</h2>
            <p className="section-header__description">
              Коротко о накопленной выборке, самых активных игроках и известных
              матчапах.
            </p>
          </div>
        </div>

        <div className="insights-grid">
          <div className="insights-summary">
            <div className="insights-summary__value">
              {insights.playedMatchesCount}
            </div>
            <div className="insights-summary__title">
              матчей против соперника в статистике
            </div>
            <p className="insights-summary__description">
              {insights.isEstablished
                ? `Колода прошла порог ${ESTABLISHED_DECK_MIN_MATCHES} матчей в ${ESTABLISHED_DECK_MIN_TOURNAMENTS} турнирах — общий процент побед уже можно сравнивать с другими колодами.`
                : `До устойчивой выборки нужно набрать ${ESTABLISHED_DECK_MIN_MATCHES} матчей минимум в ${ESTABLISHED_DECK_MIN_TOURNAMENTS} турнирах.`}
            </p>
          </div>

          <div className="insights-list">
            <article className="insight-item">
              <div className="insight-item__title">Самый активный игрок</div>
              <div className="insight-item__body">
                {insights.mostActivePlayer ? (
                  <>
                    <EntityLink
                      id={insights.mostActivePlayer.player.id}
                      name={insights.mostActivePlayer.player.name}
                      type="player"
                    />
                    — {insights.mostActivePlayer.matchesCount} матчей в{' '}
                    {insights.mostActivePlayer.tournamentsCount} турнирах.
                  </>
                ) : (
                  'Недостаточно полной истории игроков для достоверного вывода.'
                )}
              </div>
            </article>

            <article className="insight-item">
              <div className="insight-item__title">Самый частый матчап</div>
              <div className="insight-item__body">
                {insights.mostCommonMatchup ? (
                  <>
                    <EntityLink
                      colors={insights.mostCommonMatchup.opponentDeck.colors}
                      id={insights.mostCommonMatchup.opponentDeck.id}
                      name={insights.mostCommonMatchup.opponentDeck.name}
                      type="deck"
                    />
                    — {insights.mostCommonMatchup.matchesCount} матчей,{' '}
                    {formatPercent(
                      (insights.mostCommonMatchup.matchesCount /
                        insights.knownMatchupsCount) *
                        100,
                    )}{' '}
                    встреч с известной колодой оппонента.
                  </>
                ) : (
                  'Матчапы с известной колодой оппонента пока не найдены.'
                )}
              </div>
            </article>

            <article className="insight-item">
              <div className="insight-item__title">
                Лучший подтверждённый матчап
              </div>
              <div className="insight-item__body">
                {insights.bestMatchup ? (
                  <>
                    <EntityLink
                      colors={insights.bestMatchup.opponentDeck.colors}
                      id={insights.bestMatchup.opponentDeck.id}
                      name={insights.bestMatchup.opponentDeck.name}
                      type="deck"
                    />
                    — {formatPercent(insights.bestMatchup.winRate)} за{' '}
                    {insights.bestMatchup.matchesCount} матчей (
                    {formatRecord(
                      insights.bestMatchup.wins,
                      insights.bestMatchup.losses,
                      insights.bestMatchup.draws,
                    )}
                    ).
                  </>
                ) : (
                  matchupComparisonMessage
                )}
              </div>
            </article>

            <article className="insight-item">
              <div className="insight-item__title">
                Худший подтверждённый матчап
              </div>
              <div className="insight-item__body">
                {insights.worstMatchup ? (
                  <>
                    <EntityLink
                      colors={insights.worstMatchup.opponentDeck.colors}
                      id={insights.worstMatchup.opponentDeck.id}
                      name={insights.worstMatchup.opponentDeck.name}
                      type="deck"
                    />
                    — {formatPercent(insights.worstMatchup.winRate)} за{' '}
                    {insights.worstMatchup.matchesCount} матчей (
                    {formatRecord(
                      insights.worstMatchup.wins,
                      insights.worstMatchup.losses,
                      insights.worstMatchup.draws,
                    )}
                    ).
                  </>
                ) : (
                  matchupComparisonMessage
                )}
              </div>
            </article>
          </div>
        </div>

        {insights.unknownOpponentDeckCount > 0 ||
        insights.byesCount > 0 ||
        insights.unknownResultsCount > 0 ? (
          <p className="section-header__description">
            Колода оппонента определена в {insights.knownMatchupsCount} из{' '}
            {insights.playedMatchesCount} сыгранных матчей.
            {insights.unknownOpponentDeckCount > 0
              ? ` В ${insights.unknownOpponentDeckCount} матчах колода соперника не указана — они не участвуют в сравнении матчапов.`
              : ''}
            {insights.byesCount > 0
              ? ` ${insights.byesCount} BYE показано отдельно и не влияет на эффективность колоды.`
              : ''}
            {insights.unknownResultsCount > 0
              ? ` ${insights.unknownResultsCount} неизвестных результатов исключено из расчётов.`
              : ''}
          </p>
        ) : null}
      </Card>

      <DeckHistoryChart items={insights.monthlyActivity} />

      <Tabs
        activeId={activeTab}
        items={[
          {
            id: 'results',
            label: `Турниры (${deckQuery.data.tournamentResults.length})`,
          },
          { id: 'players', label: `Игроки (${deckQuery.data.players.length})` },
          {
            id: 'matchups',
            label: `Матчапы (${sortedMatchups.length})`,
          },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'results' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Результаты по турнирам</h2>
              <p className="section-header__description">
                Итог показываем вместе с размером турнира: пятое место из
                восьми и из сорока участников — разные результаты.
              </p>
            </div>
          </div>
          <Table
            columns={tournamentColumns}
            data={visibleTournamentResults}
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет результатов этой колоды."
            getRowKey={(row) => `${row.tournament.id}-${row.player.id}`}
            minWidth={760}
          />
          <LoadMorePagination
            hasMore={
              visibleTournamentResults.length <
              deckQuery.data.tournamentResults.length
            }
            isLoading={false}
            loadedCount={visibleTournamentResults.length}
            onLoadMore={() =>
              setVisibleResultsCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={deckQuery.data.tournamentResults.length}
          />
        </Card>
      ) : null}

      {activeTab === 'players' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Кто играл этой колодой</h2>
                <p className="section-header__description">
                  Сначала показываем игроков с наибольшим количеством матчей.
                  Процент побед считаем устойчивым после 20 матчей в 5
                  турнирах.
                </p>
              </div>
            </div>
          <Table
            columns={playerColumns}
            data={visiblePlayers}
            defaultSort={{ columnId: 'matches', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока не видно, кто играл этой колодой."
            getRowKey={(row) => row.player.id}
            minWidth={760}
          />
          <LoadMorePagination
            hasMore={visiblePlayers.length < deckQuery.data.players.length}
            isLoading={false}
            loadedCount={visiblePlayers.length}
            onLoadMore={() =>
              setVisiblePlayersCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={deckQuery.data.players.length}
          />
        </Card>
      ) : null}

      {activeTab === 'matchups' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Матчапы колоды</h2>
                <p className="section-header__description">
                  По умолчанию первыми идут самые частые соперники. Для
                  сравнения процента побед нужен минимум{' '}
                  {ESTABLISHED_MATCHUP_MIN_MATCHES} матчей.
                </p>
              </div>
            </div>
          <Table
            columns={matchupColumns}
            data={visibleMatchups}
            defaultSort={{ columnId: 'matches', direction: 'desc' }}
            emptyMessage="С этими фильтрами пока нет матчапов этой колоды."
            getRowKey={(row) => row.opponentDeck.id}
            minWidth={840}
          />
          <LoadMorePagination
            hasMore={visibleMatchups.length < deckQuery.data.matchups.length}
            isLoading={false}
            loadedCount={visibleMatchups.length}
            onLoadMore={() =>
              setVisibleMatchupsCount((count) => count + LIST_PAGE_SIZE)
            }
            totalCount={deckQuery.data.matchups.length}
          />
        </Card>
      ) : null}
    </div>
  );
}
