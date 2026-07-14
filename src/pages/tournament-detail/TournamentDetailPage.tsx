import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useParams } from 'react-router-dom';
import { getTournamentDetails } from '@/entities/tournament/api';
import type { TournamentMetagameItem, TournamentPlayerDeckItem, TournamentRound, TournamentStandingItem } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/formatDate';
import { formatChartDeckName } from '@/shared/lib/formatChartDeckName';
import { formatPercent } from '@/shared/lib/formatPercent';
import { MATCH_RECORD_HINT, getRecordSortValue, getRecordSortValueFromString } from '@/shared/lib/formatRecord';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { MetagameChartTooltip } from '@/shared/ui/MetagameChartTooltip';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

const standingsColumns: TableColumn<TournamentStandingItem>[] = [
  { id: 'rank', header: 'Место', align: 'right', defaultSortDirection: 'asc', render: (row) => row.rank, sortValue: (row) => row.rank },
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
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck?.name,
    render: (row) =>
      row.deck ? (
        <EntityLink
          colors={row.deck.colors}
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  {
    id: 'record',
    header: 'Результат',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => row.record,
    sortValue: (row) => getRecordSortValue(row.matchWins, row.matchLosses, row.matchDraws),
  },
  { id: 'points', header: 'Очки', align: 'right', defaultSortDirection: 'desc', render: (row) => row.points, sortValue: (row) => row.points },
  {
    id: 'omw',
    header: 'OMW',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: 'Тайбрейк по силе оппонентов: чем выше процент побед у ваших соперников, тем выше OMW.',
    render: (row) => formatPercent(row.omw),
    sortValue: (row) => row.omw,
  },
  {
    id: 'gw',
    header: 'GW',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: 'Процент выигранных игр внутри матчей этого турнира.',
    render: (row) => formatPercent(row.gw),
    sortValue: (row) => row.gw,
  },
  {
    id: 'ogw',
    header: 'OGW',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: 'Тайбрейк по проценту выигранных игр у оппонентов.',
    render: (row) => formatPercent(row.ogw),
    sortValue: (row) => row.ogw,
  },
];

const playerDeckColumns: TableColumn<TournamentPlayerDeckItem>[] = [
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
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck?.name,
    render: (row) =>
      row.deck ? (
        <EntityLink
          colors={row.deck.colors}
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  { id: 'rank', header: 'Место', align: 'right', defaultSortDirection: 'asc', render: (row) => row.rank ?? '—', sortValue: (row) => row.rank },
  {
    id: 'record',
    header: 'Результат',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: MATCH_RECORD_HINT,
    render: (row) => row.record ?? '—',
    sortValue: (row) => getRecordSortValueFromString(row.record),
  },
];

const metagameColumns: TableColumn<TournamentMetagameItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.deck.name,
    render: (row) => (
      <EntityLink
        colors={row.deck.colors}
        id={row.deck.id}
        name={row.deck.name}
        type="deck"
      />
    ),
  },
  { id: 'players', header: 'Игроков', align: 'right', defaultSortDirection: 'desc', render: (row) => row.playersCount, sortValue: (row) => row.playersCount },
  {
    id: 'share',
    header: 'Доля поля',
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: 'Какую долю от всех участников турнира заняла эта колода.',
    render: (row) => formatPercent(row.metaShare),
    sortValue: (row) => row.metaShare,
  },
  { id: 'best', header: 'Лучшее место', align: 'right', defaultSortDirection: 'asc', render: (row) => row.bestRank, sortValue: (row) => row.bestRank },
];

const roundColumns: TableColumn<TournamentRound['matches'][number]>[] = [
  {
    id: 'playerA',
    header: 'Игрок',
    sortValue: (row) => row.playerA.name,
    render: (row) => (
      <div className="stacked-cell">
        <EntityLink
          id={row.playerA.id}
          name={row.playerA.name}
          type="player"
        />
        <span className="muted-text">
          {row.playerA.deck ? (
            <EntityLink
              colors={row.playerA.deck.colors}
              id={row.playerA.deck.id}
              name={row.playerA.deck.name}
              type="deck"
            />
          ) : (
            '—'
          )}
        </span>
      </div>
    ),
  },
  {
    id: 'score',
    header: 'Счёт',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: 'Сначала счёт игрока, потом счёт оппонента.',
    render: (row) => <div className="table__score-cell">{row.scoreText}</div>,
    sortValue: (row) => getRecordSortValue(row.playerA.score, row.playerB.score),
  },
  {
    id: 'playerB',
    header: 'Оппонент',
    align: 'right',
    sortValue: (row) => row.playerB.name,
    render: (row) => (
      <div className="stacked-cell stacked-cell--end">
        <EntityLink
          id={row.playerB.id}
          name={row.playerB.name}
          type="player"
        />
        <span className="muted-text">
          {row.playerB.deck ? (
            <EntityLink
              colors={row.playerB.deck.colors}
              id={row.playerB.deck.id}
              name={row.playerB.deck.name}
              type="deck"
            />
          ) : (
            '—'
          )}
        </span>
      </div>
    ),
  },
];

function RoundBlock({
  rounds,
  activeRoundNumber,
  onRoundChange,
}: {
  rounds: TournamentRound[];
  activeRoundNumber: number | null;
  onRoundChange: (roundNumber: number | null) => void;
}) {
  return (
    <Card className="round-card">
      <div className="section-header">
        <div>
          <h3 className="section-header__title">Раунды и паринги</h3>
          <p className="section-header__description">Выберите нужный раунд и посмотрите пары именно для него.</p>
        </div>
      </div>

      {rounds.length === 0 ? <EmptyState description="По этому турниру пока нет данных по раундам." /> : null}

      <div className="accordion-list">
        {rounds.map((round) => {
          const isExpanded = round.roundNumber === activeRoundNumber;

          return (
            <div
              key={round.roundNumber}
              className={cn('accordion-item', isExpanded && 'accordion-item--open')}
            >
              <button
                className="accordion-toggle"
                onClick={() => onRoundChange(isExpanded ? null : round.roundNumber)}
                type="button"
              >
                <span className="accordion-toggle__title">Раунд {round.roundNumber}</span>
                <span className="accordion-toggle__meta">{round.matches.length} пар</span>
              </button>

              {isExpanded ? (
                <div className="accordion-panel">
                  <Table
                    columns={roundColumns}
                    data={round.matches}
                    emptyMessage="Для этого раунда пока нет пар."
                    getRowKey={(row) => `${round.roundNumber}-${row.tableNumber}`}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function TournamentDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('standings');
  const [activeRoundNumber, setActiveRoundNumber] = useState<number | null>(null);
  const detailQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['tournament-detail', id],
    queryFn: () => getTournamentDetails(id),
  });

  useEffect(() => {
    const firstRoundNumber = detailQuery.data?.rounds[0]?.roundNumber ?? null;

    setActiveRoundNumber((current) => {
      if (current && detailQuery.data?.rounds.some((round) => round.roundNumber === current)) {
        return current;
      }

      return firstRoundNumber;
    });
  }, [detailQuery.data?.rounds]);

  if (detailQuery.isLoading) {
    return <LoadingState description="Собираем данные по турниру." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(detailQuery.error, 'Не получилось открыть турнир. Попробуйте обновить страницу и зайти ещё раз.')}
        onRetry={() => {
          void detailQuery.refetch();
        }}
        title="Не удалось открыть турнир"
      />
    );
  }

  const tournament = detailQuery.data.tournament;
  const metagameChartData = detailQuery.data.metagame.slice(0, 8).map((item) => ({
    name: item.deck.name,
    metaShare: Number(item.metaShare.toFixed(1)),
    decksCount: item.playersCount,
  }));

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge key="type" variant="accent">
            {tournament.type === 'daily' ? 'Дейлик' : 'Турнир'}
          </Badge>,
          <Badge key="format">{tournament.format.name}</Badge>,
          <Badge key="club">{tournament.club.name}</Badge>,
        ]}
        description="Здесь собраны итоговые места, пары по раундам и колоды всех участников."
        eyebrow="Турнир"
        title={tournament.title}
      />

      <SummaryCards
        items={[
          { title: 'Игроков', value: tournament.playersCount },
          { title: 'Раундов', value: tournament.roundsCount },
          { title: 'Матчей', value: tournament.matchesCount },
          { title: 'Победитель', value: tournament.winner?.player.name ?? '—', subtitle: `${formatDate(tournament.date)} · ${tournament.city.name}` },
        ]}
      />

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'standings', label: 'Стендинги' },
          { id: 'rounds', label: 'Раунды и паринги' },
          { id: 'decks', label: 'Список колод' },
          { id: 'metagame', label: 'Метагейм турнира' },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'standings' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Итоговые стендинги</h2>
                <p className="section-header__description">Финальные места, очки и тайбрейки.</p>
              </div>
            </div>
          <Table
            columns={standingsColumns}
            data={detailQuery.data.standings}
            emptyMessage="Итоговые стендинги для этого турнира пока не загружены."
            getRowKey={(row) => `${row.rank}-${row.player.id}`}
          />
        </Card>
      ) : null}

      {activeTab === 'rounds' ? (
        <RoundBlock
          activeRoundNumber={activeRoundNumber}
          onRoundChange={setActiveRoundNumber}
          rounds={detailQuery.data.rounds}
        />
      ) : null}

      {activeTab === 'decks' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Список колод</h2>
                <p className="section-header__description">Игрок, колода, место и итоговый результат каждого участника.</p>
              </div>
            </div>
          <Table
            columns={playerDeckColumns}
            data={detailQuery.data.playerDecks}
            emptyMessage="Список колод для этого турнира пока не загружен."
            getRowKey={(row) => row.player.id}
          />
        </Card>
      ) : null}

      {activeTab === 'metagame' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Метагейм турнира</h2>
                <p className="section-header__description">Смотрим, какие колоды пришли на турнир и как часто они встречались.</p>
              </div>
            </div>
          <div className="chart-layout">
            <div className="chart-surface">
              <ResponsiveContainer
                height={280}
                width="100%"
              >
                <BarChart
                  data={metagameChartData}
                  layout="vertical"
                  margin={{ top: 12, right: 20, bottom: 12, left: 12 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--color-chart-grid)"
                  />
                  <XAxis
                    axisLine={false}
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={formatChartDeckName}
                    type="category"
                    width={110}
                  />
                  <Tooltip
                    content={<MetagameChartTooltip />}
                    cursor={{ fill: 'var(--color-accent-soft)' }}
                  />
                  <Bar
                    dataKey="metaShare"
                    fill="var(--color-chart-1)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Table
              columns={metagameColumns}
              data={detailQuery.data.metagame}
              emptyMessage="Метагейм этого турнира пока не загружен."
              getRowKey={(row) => row.deck.id}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
