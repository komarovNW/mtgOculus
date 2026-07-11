import { Link, useLocation } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DeckMetagameItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { TOURNAMENT_PARTICIPATIONS_HINT, TOURNAMENT_PARTICIPATIONS_LABEL } from '@/shared/lib/formatRecord';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<DeckMetagameItem>[] = [
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
  {
    id: 'players',
    header: TOURNAMENT_PARTICIPATIONS_LABEL,
    align: 'right',
    defaultSortDirection: 'desc',
    headerTitle: TOURNAMENT_PARTICIPATIONS_HINT,
    render: (row) => row.playersCount,
    sortValue: (row) => row.playersCount,
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
    id: 'share',
    header: 'Доля меты',
    headerTitle: 'Показываем, какую долю поля заняла эта колода в турнирах по выбранным фильтрам.',
    defaultSortDirection: 'desc',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.metaShare)}
        title={`Доля меты: ${formatPercent(row.metaShare)}`}
        value={row.metaShare}
      />
    ),
    sortValue: (row) => row.metaShare,
  },
  {
    id: 'best',
    header: 'Лучшее место',
    align: 'right',
    defaultSortDirection: 'asc',
    render: (row) => row.bestRank ?? '—',
    sortValue: (row) => row.bestRank,
  },
];

type DeckMetagameSectionProps = {
  items: DeckMetagameItem[];
  limit?: number;
  actionHref?: string;
  actionLabel?: string;
};

export function DeckMetagameSection({
  items,
  limit = 10,
  actionHref,
  actionLabel = 'Смотреть все колоды',
}: DeckMetagameSectionProps) {
  const location = useLocation();
  const visibleItems = items.slice(0, limit);
  const chartData = visibleItems.map((item) => ({
    name: item.deck.name,
    metaShare: Number(item.metaShare.toFixed(1)),
  }));

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Метагейм по колодам</h2>
          <p className="section-header__description">
            Показываем колоды, которые чаще всего встречались в турнирах по выбранным фильтрам. На графике и в таблице
            оставили топ-{limit}, чтобы главный срез читался быстрее.
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

      <div className="chart-layout">
        <div className="chart-surface">
          <ResponsiveContainer
            height={320}
            width="100%"
          >
            <BarChart
              data={chartData}
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
                type="category"
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px',
                  boxShadow: 'var(--color-shadow-soft)',
                }}
                cursor={{ fill: 'var(--color-accent-soft)' }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
                itemStyle={{ color: 'var(--color-text-primary)' }}
                labelStyle={{ color: 'var(--color-text-primary)' }}
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
          columns={columns}
          data={visibleItems}
          emptyMessage="По этим фильтрам пока нет данных о том, какими колодами играли."
          getRowKey={(row) => row.deck.id}
          getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
        />
      </div>
    </Card>
  );
}
