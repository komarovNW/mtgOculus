import type { getPlayerListInsights } from '@/shared/lib/playerListInsights';
import { formatPercent } from '@/shared/lib/formatPercent';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

type FavoriteDeckItem = ReturnType<
  typeof getPlayerListInsights
>['favoriteDecks'][number];

const columns: TableColumn<FavoriteDeckItem>[] = [
  {
    id: 'deck',
    header: 'Колода',
    render: (row) => (
      <EntityLink
        colors={row.deck.colors}
        id={row.deck.id}
        name={row.deck.name}
        type="deck"
      />
    ),
    sortValue: (row) => row.deck.name,
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
    id: 'share',
    header: 'Доля постоянных игроков',
    defaultSortDirection: 'desc',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.playersShare)}
        title={`Доля постоянных игроков: ${formatPercent(row.playersShare)}`}
        value={row.playersShare}
      />
    ),
    sortValue: (row) => row.playersShare,
  },
];

type PlayerFavoriteDecksProps = {
  items: FavoriteDeckItem[];
};

export function PlayerFavoriteDecks({ items }: PlayerFavoriteDecksProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">
            Любимые колоды постоянных игроков
          </h2>
          <p className="section-header__description">
            Топ-5 колод, которые чаще всего являются основными у игроков с 20+
            матчами минимум в 5 турнирах.
          </p>
        </div>
      </div>
      <Table
        columns={columns}
        data={items}
        emptyMessage="Пока недостаточно данных о любимых колодах постоянных игроков."
        getRowKey={(row) => row.deck.id}
      />
    </Card>
  );
}
