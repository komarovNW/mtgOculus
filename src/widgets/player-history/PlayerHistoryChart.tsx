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
import { formatPercent } from '@/shared/lib/formatPercent';
import { formatRecord } from '@/shared/lib/formatRecord';
import { Card } from '@/shared/ui/Card';
import { Tabs } from '@/shared/ui/Tabs';

type PlayerHistoryChartProps = {
  items: PlayerMonthlyActivity[];
};

type ChartView = 'tournaments' | 'winRate';
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

function PlayerHistoryTooltip({ active, payload }: PlayerHistoryTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{formatMonth(item.month)}</div>
      <div>Турниров: {item.tournamentsCount}</div>
      <div>Учтено результатов: {item.matchesCount}</div>
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
  { dataKey: keyof PlayerMonthlyActivity; description: string }
> = {
  tournaments: {
    dataKey: 'tournamentsCount',
    description: 'Сколько турниров игрок сыграл в каждом месяце.',
  },
  winRate: {
    dataKey: 'winRate',
    description:
      'Процент побед по месяцам в известных матчах, включая BYE.',
  },
};

export function PlayerHistoryChart({ items }: PlayerHistoryChartProps) {
  const [view, setView] = useState<ChartView>('tournaments');
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
  const currentView = viewCopy[view];

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Динамика игрока</h2>
          <p className="section-header__description">
            {currentView.description}{' '}
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
          <Tabs
            activeId={view}
            items={[
              { id: 'tournaments', label: 'Турниры' },
              { id: 'winRate', label: 'Процент побед' },
            ]}
            onChange={(id) => setView(id as ChartView)}
          />
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
            <Tooltip content={<PlayerHistoryTooltip />} />
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
