import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DeckMetagameItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/lib/formatPercent';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';
import { MetricBar } from '@/shared/ui/MetricBar';
import { Table, type TableColumn } from '@/shared/ui/Table';

const columns: TableColumn<DeckMetagameItem>[] = [
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
  { id: 'players', header: 'Игроко-участий', align: 'right', render: (row) => row.playersCount },
  { id: 'tournaments', header: 'Турниров', align: 'right', render: (row) => row.tournamentsCount },
  {
    id: 'share',
    header: 'Доля меты',
    headerTitle: 'Процент участий колоды в текущем срезе.',
    render: (row) => (
      <MetricBar
        compact
        label={formatPercent(row.metaShare)}
        title={`Meta Share: ${formatPercent(row.metaShare)}`}
        value={row.metaShare}
      />
    ),
  },
  { id: 'best', header: 'Лучшее место', align: 'right', render: (row) => row.bestRank ?? '—' },
];

type DeckMetagameSectionProps = {
  items: DeckMetagameItem[];
};

export function DeckMetagameSection({ items }: DeckMetagameSectionProps) {
  const chartData = items.slice(0, 10).map((item) => ({
    name: item.deck.name,
    metaShare: Number(item.metaShare.toFixed(1)),
  }));

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Метагейм колод</h2>
          <p className="section-header__description">
            Самые популярные архетипы текущего среза: сначала по визуальному сравнению, затем в точной таблице.
          </p>
        </div>
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
                stroke="var(--line)"
              />
              <XAxis
                axisLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="name"
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                tickLine={false}
                type="category"
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--panel-strong)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow)',
                }}
                cursor={{ fill: 'var(--accent-soft)' }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
                itemStyle={{ color: 'var(--text)' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Bar
                dataKey="metaShare"
                fill="var(--accent)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Table
          columns={columns}
          data={items}
          emptyMessage="По выбранным фильтрам метагейм пока пуст."
          getRowKey={(row) => row.deck.id}
          getRowClassName={(_, index) => (index < 3 ? 'table__row--top' : undefined)}
        />
      </div>
    </Card>
  );
}
