import type { RecentTournamentItem } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/formatDate';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<RecentTournamentItem>[] = [
  { id: 'date', header: 'Дата', render: (row) => formatDate(row.date) },
  {
    id: 'title',
    header: 'Турнир',
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
    render: (row) => <Badge variant="accent">{row.type === 'daily' ? 'Дейлик' : 'Турнир'}</Badge>,
  },
  { id: 'city', header: 'Город', render: (row) => row.city.name },
  { id: 'club', header: 'Клуб', render: (row) => row.club.name },
  { id: 'format', header: 'Формат', render: (row) => row.format.name },
  { id: 'players', header: 'Игроков', align: 'right', render: (row) => row.playersCount },
  { id: 'rounds', header: 'Раундов', align: 'right', render: (row) => row.roundsCount },
  {
    id: 'winner',
    header: 'Победитель',
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
    render: (row) =>
      row.winner?.deck ? (
        <EntityLink
          id={row.winner.deck.id}
          name={row.winner.deck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

type RecentTournamentsTableProps = {
  items: RecentTournamentItem[];
};

export function RecentTournamentsTable({ items }: RecentTournamentsTableProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Последние турниры</h2>
          <p className="section-header__description">
            Последние загруженные события с быстрым переходом в турнир, игрока-победителя и его колоду.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={items}
        emptyMessage="Пока нет турниров по выбранным фильтрам."
        getRowKey={(row) => row.id}
      />
    </Card>
  );
}
