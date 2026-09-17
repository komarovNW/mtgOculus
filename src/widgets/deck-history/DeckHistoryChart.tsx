import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DeckMonthlyActivity } from '@/shared/lib/deckDetailInsights';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';

type DeckHistoryChartProps = {
  items: DeckMonthlyActivity[];
  isComplete?: boolean;
  eventsLabel?: string;
};

type DeckHistoryDatum = DeckMonthlyActivity & {
  label: string;
};

type DeckHistoryTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: DeckHistoryDatum }>;
  eventsLabel: string;
};

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}-01T00:00:00`));
}

function DeckHistoryTooltip({ active, payload, eventsLabel }: DeckHistoryTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{formatMonth(item.month)}</div>
      <div>{eventsLabel}: {item.tournamentsCount}</div>
      <div>Участий: {item.participationsCount}</div>
    </div>
  );
}

export function DeckHistoryChart({ items, isComplete = true, eventsLabel = 'События' }: DeckHistoryChartProps) {
  const chartData = items.map<DeckHistoryDatum>((item) => ({
    ...item,
    label: formatMonth(item.month),
  }));

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card>
      <div className="section-header">
        <div>
          <div className="section-header__title-row">
            <h2 className="section-header__title">Активность по месяцам</h2>
            {!isComplete ? <Badge variant="warning">Неполная история</Badge> : null}
          </div>
          <p className="section-header__description">
            Сколько участий колоды было в каждом месяце.
          </p>
        </div>
      </div>

      <div className="chart-surface">
        <ResponsiveContainer
          height={300}
          width="100%"
        >
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 20, bottom: 12, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--color-chart-grid)"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="month"
              minTickGap={28}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              tickFormatter={(value) => formatMonth(String(value))}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              tickFormatter={(value) => String(value)}
              tickLine={false}
              width={34}
            />
            <Tooltip content={<DeckHistoryTooltip eventsLabel={eventsLabel} />} />
            <Line
              activeDot={{ r: 6 }}
              dataKey="participationsCount"
              dot={{ r: 3 }}
              stroke="var(--color-chart-1)"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
