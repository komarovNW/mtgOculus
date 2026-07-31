import { useState } from 'react';
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
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { Card } from '@/shared/ui/Card';
import { Tabs } from '@/shared/ui/Tabs';

type DeckHistoryChartProps = {
  items: DeckMonthlyActivity[];
};

type ChartView = 'participations' | 'winRate';

type DeckHistoryDatum = DeckMonthlyActivity & {
  label: string;
};

type DeckHistoryTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: DeckHistoryDatum }>;
};

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}-01T00:00:00`));
}

function DeckHistoryTooltip({ active, payload }: DeckHistoryTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{formatMonth(item.month)}</div>
      <div>Турниров: {item.tournamentsCount}</div>
      <div>Участий: {item.participationsCount}</div>
      <div>Матчей: {item.matchesCount}</div>
      <div>
        Результат: {formatRecord(item.wins, item.losses, item.draws)}
      </div>
      <div>Процент побед: {formatPercent(item.winRate)}</div>
      {item.matchesCount < 10 ? (
        <div className="chart-tooltip__note">
          Меньше 10 матчей за месяц — результат может сильно меняться.
        </div>
      ) : null}
    </div>
  );
}

const viewCopy: Record<
  ChartView,
  { dataKey: keyof DeckMonthlyActivity; description: string }
> = {
  participations: {
    dataKey: 'participationsCount',
    description: 'Сколько раз колоду приносили на турниры в каждом месяце.',
  },
  winRate: {
    dataKey: 'winRate',
    description:
      'Процент побед по месяцам. Месяцы с малым числом матчей оценивайте осторожно.',
  },
};

export function DeckHistoryChart({ items }: DeckHistoryChartProps) {
  const [view, setView] = useState<ChartView>('participations');
  const chartData = items.map<DeckHistoryDatum>((item) => ({
    ...item,
    label: formatMonth(item.month),
  }));
  const currentView = viewCopy[view];

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Динамика колоды</h2>
          <p className="section-header__description">
            {currentView.description}
          </p>
        </div>
        <Tabs
          activeId={view}
          items={[
            { id: 'participations', label: 'Участия' },
            { id: 'winRate', label: 'Процент побед' },
          ]}
          onChange={(id) => setView(id as ChartView)}
        />
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
              allowDecimals={view === 'winRate'}
              axisLine={false}
              domain={view === 'winRate' ? [0, 100] : undefined}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              tickFormatter={(value) =>
                view === 'winRate' ? `${value}%` : String(value)
              }
              tickLine={false}
              width={view === 'winRate' ? 48 : 34}
            />
            <Tooltip content={<DeckHistoryTooltip />} />
            <Line
              activeDot={{ r: 6 }}
              dataKey={currentView.dataKey}
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
