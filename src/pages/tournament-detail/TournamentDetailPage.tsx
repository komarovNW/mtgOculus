import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getTournamentDetails } from '@/entities/tournament/api';
import type { TournamentMetagameItem, TournamentPlayerDeckItem, TournamentRound, TournamentStandingItem } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';
import { SummaryCards } from '@/widgets/summary-cards/SummaryCards';

const standingsColumns: TableColumn<TournamentStandingItem>[] = [
  { id: 'rank', header: 'Место', align: 'right', render: (row) => row.rank },
  {
    id: 'player',
    header: 'Игрок',
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
    render: (row) =>
      row.deck ? (
        <EntityLink
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  { id: 'record', header: 'Результат', align: 'right', render: (row) => row.record },
  { id: 'points', header: 'Очки', align: 'right', render: (row) => row.points },
  { id: 'omw', header: 'OMW', align: 'right', render: (row) => formatPercent(row.omw) },
  { id: 'gw', header: 'GW', align: 'right', render: (row) => formatPercent(row.gw) },
  { id: 'ogw', header: 'OGW', align: 'right', render: (row) => formatPercent(row.ogw) },
];

const playerDeckColumns: TableColumn<TournamentPlayerDeckItem>[] = [
  {
    id: 'player',
    header: 'Игрок',
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
    render: (row) =>
      row.deck ? (
        <EntityLink
          id={row.deck.id}
          name={row.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
  { id: 'rank', header: 'Место', align: 'right', render: (row) => row.rank ?? '—' },
  { id: 'record', header: 'Record', align: 'right', render: (row) => row.record ?? '—' },
];

const metagameColumns: TableColumn<TournamentMetagameItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <EntityLink
        id={row.deck.id}
        name={row.deck.name}
        type="deck"
      />
    ),
  },
  { id: 'players', header: 'Игроков', align: 'right', render: (row) => row.playersCount },
  { id: 'share', header: 'Доля', align: 'right', render: (row) => formatPercent(row.metaShare) },
  { id: 'best', header: 'Лучшее место', align: 'right', render: (row) => row.bestRank },
];

function RoundBlock({ round }: { round: TournamentRound }) {
  const roundColumns: TableColumn<TournamentRound['matches'][number]>[] = [
    { id: 'table', header: 'Стол', align: 'right', render: (row) => row.tableNumber },
    {
      id: 'playerA',
      header: 'Игрок A',
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
    { id: 'score', header: 'Счёт', align: 'center', render: (row) => row.scoreText },
    {
      id: 'playerB',
      header: 'Игрок B',
      render: (row) => (
        <div className="stacked-cell">
          <EntityLink
            id={row.playerB.id}
            name={row.playerB.name}
            type="player"
          />
          <span className="muted-text">
            {row.playerB.deck ? (
              <EntityLink
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

  return (
    <Card className="round-card">
      <div className="section-header">
        <div>
          <h3 className="section-header__title">Раунд {round.roundNumber}</h3>
        </div>
      </div>
      <Table
        columns={roundColumns}
        data={round.matches}
        emptyMessage="Матчи раунда недоступны."
        getRowKey={(row) => `${round.roundNumber}-${row.tableNumber}`}
      />
    </Card>
  );
}

export function TournamentDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState('standings');
  const detailQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['tournament-detail', id],
    queryFn: () => getTournamentDetails(id),
  });

  if (detailQuery.isLoading) {
    return <LoadingState description="Загружаем турнир, стендинги и раунды." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(detailQuery.error, 'Не удалось открыть страницу турнира.')}
        onRetry={() => {
          void detailQuery.refetch();
        }}
        title="Турнир недоступен"
      />
    );
  }

  const tournament = detailQuery.data.tournament;

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
        description={`${formatDate(tournament.date)} · ${tournament.city.name}`}
        eyebrow="Детали турнира"
        title={tournament.title}
      />

      <SummaryCards
        items={[
          { title: 'Игроков', value: tournament.playersCount },
          { title: 'Раундов', value: tournament.roundsCount },
          { title: 'Матчей', value: tournament.matchesCount },
          { title: 'Победитель', value: tournament.winner?.player.name ?? '—' },
        ]}
      />

      <Tabs
        activeId={activeTab}
        items={[
          { id: 'standings', label: 'Стендинги' },
          { id: 'rounds', label: 'Раунды' },
          { id: 'decks', label: 'Колоды турнира' },
          { id: 'metagame', label: 'Метагейм' },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === 'standings' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Финальные стендинги</h2>
            </div>
          </div>
          <Table
            columns={standingsColumns}
            data={detailQuery.data.standings}
            emptyMessage="Стендинги турнира пока недоступны."
            getRowKey={(row) => `${row.rank}-${row.player.id}`}
          />
        </Card>
      ) : null}

      {activeTab === 'rounds' ? (
        <div className="page-stack">
          {detailQuery.data.rounds.map((round) => (
            <RoundBlock
              key={round.roundNumber}
              round={round}
            />
          ))}
        </div>
      ) : null}

      {activeTab === 'decks' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Игроки и колоды</h2>
            </div>
          </div>
          <Table
            columns={playerDeckColumns}
            data={detailQuery.data.playerDecks}
            emptyMessage="Список колод турнира пуст."
            getRowKey={(row) => row.player.id}
          />
        </Card>
      ) : null}

      {activeTab === 'metagame' ? (
        <Card>
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Метагейм турнира</h2>
            </div>
          </div>
          <Table
            columns={metagameColumns}
            data={detailQuery.data.metagame}
            emptyMessage="Метагейм по турниру пока недоступен."
            getRowKey={(row) => row.deck.id}
          />
        </Card>
      ) : null}
    </div>
  );
}
