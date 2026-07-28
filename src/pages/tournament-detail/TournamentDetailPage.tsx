import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useParams } from 'react-router-dom';
import { getTournamentDetails } from '@/entities/tournament/api';
import type { TournamentMetagameItem, TournamentRound, TournamentStandingItem } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/formatDate';
import { formatChartDeckName } from '@/shared/lib/formatChartDeckName';
import { formatPercent } from '@/shared/lib/formatPercent';
import { MATCH_RECORD_HINT, getRecordSortValue } from '@/shared/lib/formatRecord';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import {
  getTournamentInsights,
  getTournamentMatchKind,
} from '@/shared/lib/tournamentInsights';
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
];

const roundColumns: TableColumn<TournamentRound['matches'][number]>[] = [
  {
    id: 'table',
    header: 'Стол',
    align: 'center',
    render: (row) => row.tableNumber,
  },
  {
    id: 'playerA',
    header: 'Игрок',
    render: (row) => (
      <div className={cn('stacked-cell', row.winnerPlayerId === row.playerA.id && getTournamentMatchKind(row) === 'played' && 'match-player--winner')}>
        <div className="entity-cell">
          <EntityLink
            id={row.playerA.id}
            name={row.playerA.name}
            type="player"
          />
          {row.winnerPlayerId === row.playerA.id && getTournamentMatchKind(row) === 'played' ? (
            <Badge variant="accent">Победа</Badge>
          ) : null}
        </div>
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
    headerTitle: 'Сначала счёт игрока, потом счёт оппонента.',
    render: (row) => (
      <div className="table__score-cell">
        {getTournamentMatchKind(row) === 'bye' ? (
          <Badge variant="neutral">BYE</Badge>
        ) : getTournamentMatchKind(row) === 'unknown' ? (
          <Badge variant="warning">Нет данных</Badge>
        ) : (
          row.scoreText
        )}
      </div>
    ),
  },
  {
    id: 'playerB',
    header: 'Оппонент',
    align: 'right',
    render: (row) => (
      <div className={cn('stacked-cell stacked-cell--end', row.winnerPlayerId === row.playerB.id && 'match-player--winner')}>
        <div className="entity-cell">
          {row.winnerPlayerId === row.playerB.id ? (
            <Badge variant="accent">Победа</Badge>
          ) : null}
          {getTournamentMatchKind(row) === 'unknown' ? (
            <Badge variant="warning">Оппонент не указан</Badge>
          ) : getTournamentMatchKind(row) === 'bye' ? (
            <Badge variant="neutral">BYE</Badge>
          ) : (
            <EntityLink
              id={row.playerB.id}
              name={row.playerB.name}
              type="player"
            />
          )}
        </div>
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

function getMatchesWord(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'матч';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'матча';
  }

  return 'матчей';
}

function getSafeAetherhubUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const isAetherhub =
      url.hostname === 'aetherhub.com' ||
      url.hostname.endsWith('.aetherhub.com');

    return url.protocol === 'https:' && isAetherhub ? url.toString() : null;
  } catch {
    return null;
  }
}

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
          const byeCount = round.matches.filter(
            (match) => getTournamentMatchKind(match) === 'bye',
          ).length;
          const unknownResultsCount = round.matches.filter(
            (match) => getTournamentMatchKind(match) === 'unknown',
          ).length;
          const playedMatchesCount =
            round.matches.length - byeCount - unknownResultsCount;

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
                <span className="accordion-toggle__meta">
                  {playedMatchesCount} {getMatchesWord(playedMatchesCount)}
                  {byeCount ? ` · ${byeCount} BYE` : ''}
                  {unknownResultsCount
                    ? ` · ${unknownResultsCount} без данных`
                    : ''}
                </span>
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
  const insights = getTournamentInsights(detailQuery.data);
  const aetherhubUrl = getSafeAetherhubUrl(tournament.aetherhubUrl);
  const metagameChartData = insights.metagameChartData.map((item) => ({
    name: item.name,
    metaShare: Number(item.metaShare.toFixed(1)),
    decksCount: item.playersCount,
  }));

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          aetherhubUrl ? (
            <a
              className="button button--ghost"
              href={aetherhubUrl}
              rel="noreferrer"
              target="_blank"
            >
              Открыть на Aetherhub ↗
            </a>
          ) : undefined
        }
        badges={[
          <Badge key="type" variant="accent">
            {tournament.type === 'daily' ? 'Дейлик' : 'Турнир'}
          </Badge>,
          <Badge key="date">{formatDate(tournament.date)}</Badge>,
          <Badge key="city">{tournament.city.name}</Badge>,
          <Badge key="format">{tournament.format.name}</Badge>,
          <Badge key="club">{tournament.club.name}</Badge>,
        ]}
        description="Итоги события, путь победителя, пары по раундам и состав метагейма."
        eyebrow={tournament.type === 'daily' ? 'Дейлик' : 'Турнир'}
        title={tournament.title}
      />

      <SummaryCards
        items={[
          { title: 'Участников', value: tournament.playersCount },
          {
            title: 'Сыграно матчей',
            value: insights.playedMatchesCount,
            subtitle:
              [
                insights.byeCount
                  ? `${insights.byeCount} BYE показано отдельно`
                  : '',
                insights.unknownResultsCount
                  ? `${insights.unknownResultsCount} неизвестных записей исключено`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ') || 'Все пары сыграны против оппонента',
          },
          { title: 'Раундов', value: detailQuery.data.rounds.length },
          {
            title: 'Уникальных колод',
            value: insights.uniqueDecksCount,
            subtitle: `Колоды указаны у ${insights.deckCoverageCount} из ${tournament.playersCount} участников`,
          },
        ]}
      />

      {tournament.winner ? (
        <Card
          className="insights-card"
          tone="muted"
        >
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Победитель и путь к победе</h2>
              <p className="section-header__description">
                Итоговый результат и все раунды победителя в порядке проведения.
              </p>
            </div>
          </div>

          <div className="spotlight-grid">
            <article className="spotlight-card spotlight-card--lead">
              <div>
                <div className="spotlight-card__subtitle">Победитель</div>
                <div className="spotlight-card__title">
                  <EntityLink
                    id={tournament.winner.player.id}
                    name={tournament.winner.player.name}
                    type="player"
                  />
                </div>
              </div>
              <div className="spotlight-card__stats">
                <div className="spotlight-card__stat">
                  <span>Результат</span>
                  <strong>{insights.winnerStanding?.record ?? '—'}</strong>
                </div>
                <div className="spotlight-card__stat">
                  <span>Колода</span>
                  <strong className="spotlight-card__deck">
                    {tournament.winner.deck ? (
                      <EntityLink
                        colors={tournament.winner.deck.colors}
                        id={tournament.winner.deck.id}
                        name={tournament.winner.deck.name}
                        type="deck"
                      />
                    ) : (
                      '—'
                    )}
                  </strong>
                </div>
              </div>
            </article>

            {insights.winnerPath.map((item) => (
              <article
                key={`${item.roundNumber}-${item.tableNumber}`}
                className="spotlight-card"
              >
                <div className="spotlight-card__header">
                  <div>
                    <div className="spotlight-card__subtitle">
                      Раунд {item.roundNumber} · стол {item.tableNumber}
                    </div>
                    <div className="spotlight-card__title">{item.scoreText}</div>
                  </div>
                  {item.isBye ? <Badge variant="warning">BYE</Badge> : null}
                </div>
                <div>
                  <div className="spotlight-card__subtitle">Оппонент</div>
                  {item.isBye ? (
                    <Badge variant="neutral">BYE</Badge>
                  ) : (
                    <EntityLink
                      id={item.opponent.id}
                      name={item.opponent.name}
                      type="player"
                    />
                  )}
                </div>
                {!item.isBye && item.opponent.deck ? (
                  <div className="spotlight-card__deck">
                    <EntityLink
                      colors={item.opponent.deck.colors}
                      id={item.opponent.deck.id}
                      name={item.opponent.deck.name}
                      type="deck"
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      <Card
        className="insights-card"
        tone="muted"
      >
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Коротко о турнире</h2>
            <p className="section-header__description">
              Описываем состав поля и итоги без выводов по винрейту на маленькой выборке.
            </p>
          </div>
        </div>
        <div className="insights-list">
          <article className="insight-item">
            <div className="insight-item__title">
              {insights.mostPopularDecks.length === 1
                ? 'Самая популярная колода'
                : 'Лидеры по представительству'}
            </div>
            <div className="insight-item__body">
              {insights.mostPopularDecks.length === 1 && insights.mostPopularDeck ? (
                <>
                  <EntityLink
                    colors={insights.mostPopularDeck.deck.colors}
                    id={insights.mostPopularDeck.deck.id}
                    name={insights.mostPopularDeck.deck.name}
                    type="deck"
                  />{' '}
                  — {insights.mostPopularDeck.playersCount} участников и{' '}
                  {formatPercent(insights.mostPopularDeck.metaShare)} поля.
                </>
              ) : insights.mostPopularDecks.length > 1 && insights.mostPopularDeck ? (
                <>
                  Единоличного лидера нет. Колод с максимальным
                  представительством: {insights.mostPopularDecks.length}. У каждой —{' '}
                  {insights.mostPopularDeck.playersCount} участий и{' '}
                  {formatPercent(insights.mostPopularDeck.metaShare)} поля.
                </>
              ) : (
                'Данные о колодах пока не загружены.'
              )}
            </div>
          </article>
          <article className="insight-item">
            <div className="insight-item__title">Разнообразие поля</div>
            <div className="insight-item__body">
              {insights.uniqueDecksCount} разных колод у{' '}
              {insights.deckCoverageCount} участников. Колод, представленных
              только одним игроком: {insights.singlePlayerDecksCount}.
            </div>
          </article>
          <article className="insight-item">
            <div className="insight-item__title">Без поражений</div>
            <div className="insight-item__body">
              {insights.undefeatedPlayers.length ? (
                <>
                  Турнир без поражений завершили:{' '}
                  {insights.undefeatedPlayers.map((item, index) => (
                    <span key={item.player.id}>
                      {index > 0 ? ', ' : ''}
                      <EntityLink
                        id={item.player.id}
                        name={item.player.name}
                        type="player"
                      />
                    </span>
                  ))}
                  .
                </>
              ) : (
                'Никто из участников не завершил турнир без поражений.'
              )}
            </div>
          </article>
        </div>
      </Card>

      {insights.missingDecksCount > 0 ? (
        <Card tone="accent">
          <div className="section-header">
            <div>
              <div className="section-header__title-row">
                <h2 className="section-header__title">Данные заполнены не полностью</h2>
                <Badge variant="warning">
                  Без колоды: {insights.missingDecksCount}
                </Badge>
              </div>
              <p className="section-header__description">
                Метагейм рассчитан только по участникам, для которых указана колода.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'standings', label: 'Стендинги' },
          { id: 'rounds', label: 'Раунды и паринги' },
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

      {activeTab === 'metagame' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Метагейм турнира</h2>
                <p className="section-header__description">
                  Состав поля без попытки оценивать силу колод по результатам одного
                  турнира. На графике редкие колоды объединены в «Другие».
                </p>
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
                    tickFormatter={(value: number) => `${value}%`}
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
              data={insights.metagameItems}
              emptyMessage="Метагейм этого турнира пока не загружен."
              getRowKey={(row) => row.deck.id}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
