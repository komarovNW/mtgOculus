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
import type { TournamentListItem } from '@/shared/api/types';
import { getMonthlyAttendance } from '@/shared/lib/dailyInsights';
import { formatDate } from '@/shared/lib/formatDate';
import { Card } from '@/shared/ui/Card';
import { Tabs } from '@/shared/ui/Tabs';

const MAX_VISIBLE_EVENTS = 30;

type DailyAttendanceChartProps = {
  items: TournamentListItem[];
};

type ChartView = 'events' | 'months';

type AttendanceDatum = {
  key: string;
  label: string;
  title: string;
  details: string;
  playersCount: number;
  valueLabel: string;
};

type AttendanceTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: AttendanceDatum }>;
};

function AttendanceTooltip({ active, payload }: AttendanceTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{item.title}</div>
      <div>{item.details}</div>
      <div>{item.valueLabel}: {item.playersCount.toFixed(item.valueLabel === 'Игроков' ? 0 : 1)}</div>
    </div>
  );
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00`);

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function DailyAttendanceChart({ items }: DailyAttendanceChartProps) {
  const [view, setView] = useState<ChartView>('events');
  const eventData = [...items]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-MAX_VISIBLE_EVENTS)
    .map<AttendanceDatum>((item) => ({
      key: item.date,
      label: formatDate(item.date).slice(0, 5),
      title: item.title,
      details: `${formatDate(item.date)} · ${item.club.name}`,
      playersCount: item.playersCount,
      valueLabel: 'Игроков',
    }));
  const monthlyData = getMonthlyAttendance(items).map<AttendanceDatum>((item) => ({
    key: item.month,
    label: formatMonth(item.month),
    title: formatMonth(item.month),
    details: `Дейликов: ${item.eventsCount}`,
    playersCount: item.averagePlayers,
    valueLabel: 'Игроков в среднем',
  }));
  const chartData = view === 'events' ? eventData : monthlyData;

  if (eventData.length < 2) {
    return null;
  }

  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Динамика посещаемости</h2>
          <p className="section-header__description">
            {view === 'events'
              ? `Количество игроков на последних ${eventData.length} дейликах по текущим фильтрам.`
              : 'Среднее количество игроков на один дейлик в каждом месяце.'}
          </p>
        </div>
        <Tabs
          activeId={view}
          items={[
            { id: 'events', label: 'По дейликам' },
            { id: 'months', label: 'По месяцам' },
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
              dataKey="key"
              minTickGap={28}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              tickFormatter={(_, index) => chartData[index]?.label ?? ''}
              tickLine={false}
            />
            <YAxis
              allowDecimals={view === 'months'}
              axisLine={false}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              tickLine={false}
              width={34}
            />
            <Tooltip content={<AttendanceTooltip />} />
            <Line
              activeDot={{ r: 6 }}
              dataKey="playersCount"
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
