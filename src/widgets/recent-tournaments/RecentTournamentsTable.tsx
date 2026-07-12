import { Link, useLocation } from 'react-router-dom';
import type { RecentTournamentItem } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/formatDate';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<RecentTournamentItem>[] = [
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.date),
    sortValue: (row) => row.date,
  },
  {
    id: 'title',
    header: 'Турнир',
    sortValue: (row) => row.title,
    render: (row) => (
      <EntityLink
        id={row.id}
        name={row.title}
        type="tournament"
      />
    ),
  },
  {
    id: 'type',
    header: 'Тип',
    sortValue: (row) => row.type,
    render: (row) => <Badge variant="accent">{row.type === 'daily' ? 'Дейлик' : 'Турнир'}</Badge>,
  },
  { id: 'city', header: 'Город', render: (row) => row.city.name, sortValue: (row) => row.city.name },
  { id: 'club', header: 'Клуб', render: (row) => row.club.name, sortValue: (row) => row.club.name },
  { id: 'format', header: 'Формат', render: (row) => row.format.name, sortValue: (row) => row.format.name },
  {
    id: 'players',
    header: 'Игроков',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
  },
  {
    id: 'rounds',
    header: 'Раундов',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.roundsCount,
    sortValue: (row) => row.roundsCount,
  },
  {
    id: 'winner',
    header: 'Победитель',
    sortValue: (row) => row.winner?.player.name,
    render: (row) =>
      row.winner ? (
        <EntityLink
          id={row.winner.player.id}
          name={row.winner.player.name}
          type="player"
        />
      ) : (
        '—'
      ),
  },
  {
    id: 'deck',
    header: 'Колода',
    sortValue: (row) => row.winner?.deck?.name,
    render: (row) => {
      const deck = row.winner?.deck;

      return deck ? (
        <EntityLink
          colors={deck.colors}
          id={deck.id}
          name={deck.name}
          type="deck"
        />
      ) : (
        '—'
      );
    },
  },
];

const compactColumns: TableColumn<RecentTournamentItem>[] = [
  {
    id: 'date',
    header: 'Дата',
    defaultSortDirection: 'desc',
    render: (row) => formatDate(row.date),
    sortValue: (row) => row.date,
  },
  {
    id: 'title',
    header: 'Турнир',
    sortValue: (row) => row.title,
    render: (row) => (
      <div className="stacked-cell stacked-cell--compact">
        <EntityLink
          id={row.id}
          name={row.title}
          type="tournament"
        />
        <span className="muted-text">
          {row.club.name} · {row.type === 'daily' ? 'Дейлик' : 'Турнир'}
        </span>
      </div>
    ),
  },
  {
    id: 'players',
    header: 'Игроков',
    align: 'right',
    defaultSortDirection: 'desc',
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
  },
  {
    id: 'winner',
    header: 'Победитель',
    sortValue: (row) => row.winner?.player.name,
    render: (row) => {
      const winner = row.winner;
      const deck = winner?.deck;

      return winner ? (
        <div className="stacked-cell stacked-cell--compact">
          <EntityLink
            id={winner.player.id}
            name={winner.player.name}
            type="player"
          />
          <span className="muted-text">
            {deck ? (
              <EntityLink
                colors={deck.colors}
                id={deck.id}
                name={deck.name}
                type="deck"
              />
            ) : (
              'Колода не указана'
            )}
          </span>
        </div>
      ) : (
        '—'
      );
    },
  },
];

type RecentTournamentsTableProps = {
  items: RecentTournamentItem[];
  limit?: number;
  compact?: boolean;
  actionHref?: string;
  actionLabel?: string;
};

export function RecentTournamentsTable({
  items,
  limit,
  compact = false,
  actionHref,
  actionLabel = 'Смотреть все турниры',
}: RecentTournamentsTableProps) {
  const location = useLocation();
  const visibleItems = limit ? items.slice(0, limit) : items;

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Последние турниры</h2>
          <p className="section-header__description">
            {compact
              ? 'Показываем последние загруженные турниры, чтобы быстро понять, что уже есть в статистике.'
              : 'Собрали последние загруженные турниры.'}
          </p>
        </div>
        {actionHref ? (
          <Link
            className="button button--ghost section-link"
            to={{
              pathname: actionHref,
              search: location.search,
            }}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <Table
        columns={compact ? compactColumns : columns}
        data={visibleItems}
        emptyMessage="Пока нет турниров по этим фильтрам."
        getRowKey={(row) => row.id}
        layout={compact ? 'auto' : 'fixed'}
        minWidth={compact ? 680 : 880}
      />
    </Card>
  );
}
