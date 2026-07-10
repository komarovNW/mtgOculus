import type { TopPlayerItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<TopPlayerItem>[] = [
  {
    id: 'rank',
    header: '#',
    align: 'center',
    render: (_, index) => <span className={`table__rank ${index < 3 ? 'table__rank--top' : ''}`}>{index + 1}</span>,
  },
  {
    id: 'player',
    header: 'Игрок',
    render: (row) => (
      <div className="entity-cell">
        <EntityLink
          id={row.player.id}
          name={row.player.name}
          type="player"
        />
        {row.isSmallSample ? (
          <Badge
            title="Слишком мало матчей для устойчивой оценки результата."
            variant="warning"
          >
            Малая выборка
          </Badge>
        ) : null}
      </div>
    ),
  },
  { id: 'tournaments', header: 'Турниров', align: 'right', render: (row) => row.tournamentsCount },
  { id: 'matches', header: 'Матчей', align: 'right', render: (row) => row.matchesCount },
  {
    id: 'record',
    header: 'Record',
    align: 'right',
    render: (row) => formatRecord(row.matchWins, row.matchLosses, row.matchDraws),
  },
  {
    id: 'winrate',
    header: 'Winrate',
    headerTitle: 'Процент выигранных матчей игрока в текущем срезе.',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.matchWinRate)}
        title={`Winrate: ${formatPercent(row.matchWinRate)}`}
        value={row.matchWinRate}
      />
    ),
  },
  { id: 'bestRank', header: 'Лучший результат', align: 'right', render: (row) => row.bestRank ?? '—' },
  {
    id: 'deck',
    header: 'Частая колода',
    render: (row) =>
      row.mostPlayedDeck ? (
        <EntityLink
          id={row.mostPlayedDeck.id}
          name={row.mostPlayedDeck.name}
          type="deck"
        />
      ) : (
        '—'
      ),
  },
];

type TopPlayersTableProps = {
  items: TopPlayerItem[];
};

export function TopPlayersTable({ items }: TopPlayersTableProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Топ игроков</h2>
          <p className="section-header__description">
            Лучшие игроки среза по совокупности матчей, результатов и повторяемости выступлений.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={items}
        emptyMessage="По выбранным фильтрам пока нет игроков."
        getRowKey={(row) => row.player.id}
        getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
      />
    </Card>
  );
}
