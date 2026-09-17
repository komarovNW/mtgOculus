import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PlayerMonthlyActivity } from '@/shared/lib/playerDetailInsights';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { Tabs } from '@/shared/ui/Tabs';

type PlayerHistoryChartProps = {
  items: PlayerMonthlyActivity[];
  isComplete?: boolean;
  eventsLabel?: string;
};

type ChartPeriod = 'latestYear' | 'all';

type PlayerHistoryDatum = PlayerMonthlyActivity & {
  label: string;
};

type PlayerHistoryTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: PlayerHistoryDatum }>;
};

function formatMonth(value: string, includeYear = true) {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  }).format(new Date(`${value}-01T00:00:00`));
}

function PlayerHistoryTooltip({
  active,
  eventsLabel,
  payload,
}: PlayerHistoryTooltipProps & { eventsLabel: string }) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{formatMonth(item.month)}</div>
      <div>{eventsLabel[0].toUpperCase() + eventsLabel.slice(1)}: {item.tournamentsCount}</div>
      <div>Сыграно матчей: {item.playedMatchesCount}</div>
      {item.byesCount > 0 ? <div>BYE: {item.byesCount}</div> : null}
    </div>
  );
}

export function PlayerHistoryChart({
  eventsLabel = 'событий',
  items,
  isComplete = true,
}: PlayerHistoryChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>('latestYear');
  const latestYear = [...items]
    .sort((left, right) => right.month.localeCompare(left.month))[0]
    ?.month.slice(0, 4);
  const latestYearItems = latestYear
    ? items.filter((item) => item.month.startsWith(latestYear))
    : [];
  const canLimitToLatestYear =
    latestYearItems.length >= 2 &&
    latestYearItems.length < items.length;

  useEffect(() => {
    setPeriod('latestYear');
  }, [latestYear]);

  const visibleItems =
    period === 'latestYear' && canLimitToLatestYear
      ? latestYearItems
      : items;
  const chartData = visibleItems.map<PlayerHistoryDatum>((item) => ({
    ...item,
    label: formatMonth(
      item.month,
      period === 'all' || !canLimitToLatestYear,
    ),
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
            Сколько {eventsLabel} игрок сыграл в каждом месяце.{' '}
            {period === 'latestYear' && canLimitToLatestYear
              ? `Показан ${latestYear} год.`
              : 'Показана вся доступная история.'}
          </p>
        </div>
        <div className="player-history-controls">
          {canLimitToLatestYear ? (
            <Tabs
              activeId={period}
              items={[
                {
                  id: 'latestYear',
                  label: latestYear ?? 'Последний год',
                },
                { id: 'all', label: 'Вся история' },
              ]}
              onChange={(id) => setPeriod(id as ChartPeriod)}
            />
          ) : null}
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
              tickFormatter={(value) =>
                formatMonth(
                  String(value),
                  period === 'all' || !canLimitToLatestYear,
                )
              }
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
            <Tooltip content={<PlayerHistoryTooltip eventsLabel={eventsLabel} />} />
            <Line
              activeDot={{ r: 6 }}
              dataKey="tournamentsCount"
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
