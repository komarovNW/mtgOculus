import { EventLinkScope } from '@/shared/lib/eventLinkScope';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useParams } from 'react-router-dom';
import { getTournamentDetails } from '@/entities/tournament/api';
import type { TournamentMetagameItem, TournamentRound, TournamentStandingItem } from '@/shared/api/types';
import { formatPlayoffStage } from '@/shared/lib/formatPlayoffStage';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/formatDate';
import { formatChartDeckName } from '@/shared/lib/formatChartDeckName';
import { formatPercent } from '@/shared/lib/formatPercent';
import { MATCH_RECORD_HINT, getRecordSortValue } from '@/shared/lib/formatRecord';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import {
  getTournamentInsights,
  getTournamentStandingHighlights,
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
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { getDeckQualificationCounts } from '@/shared/lib/tournamentExploration';
import { PlayoffBracket } from './components/PlayoffBracket';
import { PlayerTournamentMatches } from '@/widgets/player-tournament-matches/PlayerTournamentMatches';
import './tournament-detail.css';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

function getStandingsColumns(isTournament: boolean): TableColumn<TournamentStandingItem>[] {
  return [
  { id: 'rank', header: 'Место', headerTitle: 'Итоговое место события, с учётом плей-офф, если он был.', align: 'center', defaultSortDirection: 'asc', render: (row) => row.rank, sortValue: (row) => row.rank },
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
    header: isTournament ? 'Швейцарка' : 'Результат',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: isTournament
      ? `${MATCH_RECORD_HINT} Плей-офф в эту колонку не входит.`
      : MATCH_RECORD_HINT,
    render: (row) => row.record,
    sortValue: (row) => getRecordSortValue(row.matchWins, row.matchLosses, row.matchDraws),
  },
  { id: 'points', header: 'Очки', align: 'center', defaultSortDirection: 'desc', render: (row) => row.points, sortValue: (row) => row.points },
  {
    id: 'omw',
    header: 'OMW',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: 'Тайбрейк по силе оппонентов: чем выше процент побед у ваших соперников, тем выше OMW.',
    render: (row) => formatPercent(row.omw),
    sortValue: (row) => row.omw,
  },
  {
    id: 'gw',
    header: 'GW',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: 'Процент выигранных игр по стендингам. Для турниров — только швейцарка.',
    render: (row) => formatPercent(row.gw),
    sortValue: (row) => row.gw,
  },
  {
    id: 'ogw',
    header: 'OGW',
    align: 'center',
    defaultSortDirection: 'desc',
    headerTitle: 'Тайбрейк по проценту выигранных игр у оппонентов.',
    render: (row) => formatPercent(row.ogw),
    sortValue: (row) => row.ogw,
  },
  ];
}

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
  { id: 'players', header: 'Игроков', align: 'center', defaultSortDirection: 'desc', render: (row) => row.playersCount, sortValue: (row) => row.playersCount },
  {
    id: 'share',
    header: 'Доля поля',
    align: 'center',
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
    align: 'center',
    render: (row) => (
      <div className={cn('stacked-cell stacked-cell--end', row.winnerPlayerId === row.playerB.id && 'match-player--winner')}>
        <div className="entity-cell">
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

function getSafeSourceLink(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const isAetherhub =
      url.hostname === 'aetherhub.com' ||
      url.hostname.endsWith('.aetherhub.com');
    const isMelee =
      url.hostname === 'melee.gg' ||
      url.hostname.endsWith('.melee.gg');

    if (url.protocol !== 'https:') return null;
    if (isAetherhub) return { href: url.toString(), label: 'Открыть на Aetherhub ↗' };
    if (isMelee) return { href: url.toString(), label: 'Открыть на Melee.gg ↗' };

    return null;
  } catch {
    return null;
  }
}

function RoundBlock({
  rounds,
  activeRoundNumber,
  onRoundChange,
  isTournament,
}: {
  rounds: TournamentRound[];
  isTournament: boolean;
  activeRoundNumber: number | null;
  onRoundChange: (roundNumber: number | null) => void;
}) {
  return (
    <Card className="round-card">
      <div className="section-header">
        <div>
          <h3 className="section-header__title">{isTournament ? 'Швейцарка: раунды и паринги' : 'Раунды и паринги'}</h3>
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
  const [playerSearch, setPlayerSearch] = useState('');
  const [onlyQualified, setOnlyQualified] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('standings');
    setPlayerSearch('');
    setOnlyQualified(false);
    setExpandedPlayerId(null);
  }, [id]);
  const [activeRoundNumber, setActiveRoundNumber] = useState<number | null>(null);
  const detailQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['tournament-detail', id],
    queryFn: ({ signal }) => getTournamentDetails(id, { signal }),
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
  const standingHighlights = getTournamentStandingHighlights(detailQuery.data);
  const standingsColumns = getStandingsColumns(tournament.type === 'tournament');
  const highlightedColumns: TableColumn<TournamentStandingItem>[] = [
    ...standingsColumns.map((column) => column.id === 'rank' ? {
      ...column,
      render: (row: TournamentStandingItem) => standingHighlights.has(row.player.id)
        ? <span className="standing-place--highlighted" title={standingHighlights.get(row.player.id)} aria-label={`${row.rank} место · ${standingHighlights.get(row.player.id)}`}>{row.rank}</span>
        : row.rank,
    } : column),
    {
      id: 'actions',
      header: '',
      align: 'center',
      render: (row) => (
        <button
          aria-controls={expandedPlayerId === row.player.id ? `matches-${row.player.id}` : undefined}
          aria-expanded={expandedPlayerId === row.player.id}
          aria-label={`${expandedPlayerId === row.player.id ? 'Скрыть' : 'Показать'} матчи игрока ${row.player.name}`}
          className="standing-player-toggle"
          onClick={() => setExpandedPlayerId((current) => current === row.player.id ? null : row.player.id)}
          type="button"
        >
          <span aria-hidden="true">›</span>
        </button>
      ),
    },
  ];
  const searchTerms = playerSearch.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').split(/\s+/).filter(Boolean);
  const visibleStandings = detailQuery.data.standings.filter((row) =>
    (!onlyQualified || standingHighlights.has(row.player.id)) &&
    searchTerms.every((term) => row.player.name.toLocaleLowerCase('ru').replace(/ё/g, 'е').includes(term)),
  );
  const qualificationCounts = getDeckQualificationCounts(detailQuery.data);
  const resultColumns: TableColumn<TournamentMetagameItem>[] = [
    ...metagameColumns,
    ...(tournament.type === 'tournament' && (tournament.playoffSize || tournament.playoffSize === null) ? [{
      id: 'qualified', header: tournament.playoffSize ? `В топ-${tournament.playoffSize}` : 'В первой тройке',
      align: 'center' as const,
      render: (row: TournamentMetagameItem) => qualificationCounts.get(row.deck.id) ?? 0,
      sortValue: (row: TournamentMetagameItem) => qualificationCounts.get(row.deck.id) ?? 0,
    }] : []),
    { id: 'bestRank', header: 'Лучшее место', align: 'center', defaultSortDirection: 'asc', render: (row) => row.bestRank, sortValue: (row) => row.bestRank },
  ];
  const sourceLink = getSafeSourceLink(tournament.sourceUrl);
  const metagameChartData = insights.metagameChartData.map((item) => ({
    name: item.name,
    metaShare: Number(item.metaShare.toFixed(1)),
    decksCount: item.playersCount,
  }));

  return (
    <EventLinkScope.Provider value={{ cityId: tournament.city.id, clubId: tournament.club.id, formatId: tournament.format.id, tournamentType: tournament.type }}>
    <div className="page-stack">
      <PageHeader
        actions={
          sourceLink ? (
            <a
              className="button button--ghost"
              href={sourceLink.href}
              rel="noreferrer"
              target="_blank"
            >
              {sourceLink.label}
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
        description="Итоги события, пары по раундам и состав метагейма."
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
          { title: tournament.type === 'tournament' ? 'Раундов швейцарки' : 'Раундов', value: tournament.roundsCount },
          ...(tournament.type === 'tournament' ? [{
            title: 'Плей-офф',
            value: tournament.playoffSize ? `Топ-${tournament.playoffSize}` : tournament.playoffSize === null ? 'Только швейцарка' : 'Нет данных',
            valueSize: 'compact' as const,
          }] : []),
        ]}
      />

      {tournament.winner ? (
        <Card
          className="insights-card"
          tone="muted"
        >
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Результат победителя</h2>
              <p className="section-header__description">
                Итоговый результат и матчи по раундам.
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
                  <span>{tournament.type === 'tournament' ? 'Результат швейцарки' : 'Результат'}</span>
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
                      {item.playoffTopN ? formatPlayoffStage(item.playoffTopN) : `Раунд ${item.roundNumber}`} · стол {item.tableNumber}
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
              Колоды участников, их доля в турнире и итоговые места.
            </p>
          </div>
        </div>
        <div className="insights-list">
          {insights.mostPopularDeck && insights.mostPopularDeck.playersCount > 1 ? (
            <article className="insight-item">
              <div className="insight-item__title">
                {insights.mostPopularDecks.length === 1
                  ? 'Самая популярная колода'
                  : 'Самые популярные колоды'}
              </div>
              <div className="insight-item__body">
                {insights.mostPopularDecks.length === 1 ? (
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
                ) : (
                  <>
                    {insights.mostPopularDecks.map((item, index) => (
                      <span key={item.deck.id}>
                        {index > 0 ? ', ' : null}
                        <EntityLink
                          colors={item.deck.colors}
                          id={item.deck.id}
                          name={item.deck.name}
                          type="deck"
                        />
                      </span>
                    ))}{' '}
                    — по {insights.mostPopularDeck.playersCount} участника и{' '}
                    {formatPercent(insights.mostPopularDeck.metaShare)} поля.
                  </>
                )}
              </div>
            </article>
          ) : null}
          <article className="insight-item">
            <div className="insight-item__title">{tournament.type === 'tournament' ? 'Без поражений в швейцарке' : 'Без поражений'}</div>
            <div className="insight-item__body">
              {insights.undefeatedPlayers.length ? (
                <>
                  {tournament.type === 'tournament' ? 'Швейцарку без поражений завершили: ' : 'Турнир без поражений завершили: '}
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
                'Нет участников без поражений в стендингах.'
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
                {`Колоды указаны у ${insights.deckCoverageCount} из ${tournament.playersCount} участников. Метагейм рассчитан только по этим данным.`}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'standings', label: 'Стендинги' },
          { id: 'rounds', label: tournament.type === 'tournament' ? 'Швейцарка' : 'Раунды и паринги' },
          ...(detailQuery.data.playoff?.length ? [{ id: 'playoff', label: 'Плей-офф' }] : []),
          { id: 'metagame', label: 'Метагейм турнира' },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'standings' ? (
        <Card className="standings-card">
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Итоговые стендинги</h2>
                <p className="section-header__description">{tournament.type === 'tournament' ? (tournament.playoffSize ? 'Итоговые места с учётом плей-офф. Результат, очки и тайбрейки — по швейцарке.' : 'Итоговые места, результат, очки и тайбрейки по швейцарке.') : 'Финальные места, очки и тайбрейки.'}</p>
              </div>
            </div>
          <div className="standings-toolbar">
            <Input label="Найти игрока" type="search" placeholder="Имя или фамилия" value={playerSearch} onChange={(event) => setPlayerSearch(event.target.value)} />
            {standingHighlights.size > 0 ? <div className="standings-toolbar__scope" role="group" aria-label="Участники стендингов">
              <Button type="button" variant={!onlyQualified ? 'primary' : 'secondary'} aria-pressed={!onlyQualified} onClick={() => setOnlyQualified(false)}>Все участники</Button>
              <Button type="button" variant={onlyQualified ? 'primary' : 'secondary'} aria-pressed={onlyQualified} onClick={() => setOnlyQualified(true)}>{tournament.playoffSize ? `Только топ-${tournament.playoffSize}` : 'Первая тройка'}</Button>
            </div> : null}
          </div>
          <div className="standings-results-bar">
            <p className="muted-text" aria-live="polite">Показано {visibleStandings.length} из {detailQuery.data.standings.length}</p>
            {playerSearch || onlyQualified ? <Button type="button" variant="ghost" onClick={() => { setPlayerSearch(''); setOnlyQualified(false); }}>Сбросить поиск и фильтр</Button> : null}
          </div>
          <Table
            columns={highlightedColumns}
            getRowClassName={(row) => standingHighlights.has(row.player.id) ? 'table__row--qualified' : undefined}
            data={visibleStandings}
            renderAfterRow={(row) => expandedPlayerId === row.player.id ? <tr><td className="standing-details-cell" colSpan={highlightedColumns.length}><PlayerTournamentMatches details={detailQuery.data} standing={row} /></td></tr> : null}
            emptyMessage={playerSearch || onlyQualified ? 'Нет игроков по выбранным условиям. Измените поиск или сбросьте фильтр.' : 'Итоговые стендинги для этого турнира пока не загружены.'}
            getRowKey={(row) => `${row.rank}-${row.player.id}`}
          />
        </Card>
      ) : null}

      {activeTab === 'playoff' ? <PlayoffBracket stages={detailQuery.data.playoff ?? []} /> : null}

      {activeTab === 'rounds' ? (
        <RoundBlock
          activeRoundNumber={activeRoundNumber}
          onRoundChange={setActiveRoundNumber}
          isTournament={tournament.type === 'tournament'}
          rounds={detailQuery.data.rounds}
        />
      ) : null}

      {activeTab === 'metagame' ? (
        <Card>
          <div className="section-header">
              <div>
                <h2 className="section-header__title">Метагейм турнира</h2>
                <p className="section-header__description">
                  Редкие колоды объединены в «Другие».
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
              columns={resultColumns}
              data={insights.metagameItems}
              emptyMessage="Метагейм этого турнира пока не загружен."
              getRowKey={(row) => row.deck.id}
            />
          </div>
        </Card>
      ) : null}
    </div>
    </EventLinkScope.Provider>
  );
}
