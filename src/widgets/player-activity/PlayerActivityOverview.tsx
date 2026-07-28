import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { getPlayerListInsights } from '@/shared/lib/playerListInsights';
import { formatPercent } from '@/shared/lib/formatPercent';
import { Card } from '@/shared/ui/Card';
import { StatCard } from '@/shared/ui/StatCard';

type PlayerActivityOverviewProps = {
  insights: ReturnType<typeof getPlayerListInsights>;
};

type ActivityDatum = {
  label: string;
  playersCount: number;
  playersShare: number;
};

type ActivityTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: ActivityDatum }>;
};

function ActivityTooltip({ active, payload }: ActivityTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{item.label}</div>
      <div>Игроков: {item.playersCount}</div>
      <div>Доля: {formatPercent(item.playersShare)}</div>
    </div>
  );
}

function formatMedian(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function PlayerActivityOverview({ insights }: PlayerActivityOverviewProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Активность сообщества</h2>
          <p className="section-header__description">
            Показываем типичную активность, долю постоянных участников и насколько
            статистика зависит от самых активных игроков.
          </p>
        </div>
      </div>

      <div className="page-stack">
        <div className="summary-grid">
          <StatCard
            subtitle="Половина игроков сыграла не больше этого значения"
            title="Медиана турниров"
            value={formatMedian(insights.medianTournaments)}
          />
          <StatCard
            subtitle="Медиана устойчивее среднего и не зависит от рекордсменов"
            title="Медиана результатов"
            value={formatMedian(insights.medianMatches)}
          />
          <StatCard
            subtitle={`${insights.establishedPlayersCount} игроков прошли порог 20 матчей / 5 турниров`}
            title="Постоянные игроки"
            value={formatPercent(insights.establishedPlayersShare)}
          />
          <StatCard
            subtitle="Доля всех учтённых результатов у десяти самых активных игроков"
            title="Концентрация топ-10"
            value={formatPercent(insights.topTenMatchesShare)}
          />
        </div>

        <div>
          <div className="section-header">
            <div>
              <h3 className="section-header__title">Сколько турниров сыграли участники</h3>
              <p className="section-header__description">
                Распределение всех найденных игроков по количеству участий.
              </p>
            </div>
          </div>
          <div className="chart-surface">
            <ResponsiveContainer
              height={300}
              width="100%"
            >
              <BarChart
                data={insights.activityGroups}
                margin={{ top: 12, right: 20, bottom: 12, left: 0 }}
              >
                <CartesianGrid
                  stroke="var(--color-chart-grid)"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  content={<ActivityTooltip />}
                  cursor={{ fill: 'var(--color-accent-soft)' }}
                />
                <Bar
                  dataKey="playersCount"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
