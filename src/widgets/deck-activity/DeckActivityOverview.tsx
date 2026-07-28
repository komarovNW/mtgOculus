import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { getDeckListInsights } from '@/shared/lib/deckListInsights';
import { formatPercent } from '@/shared/lib/formatPercent';
import { Card } from '@/shared/ui/Card';
import { StatCard } from '@/shared/ui/StatCard';

type DeckActivityOverviewProps = {
  insights: ReturnType<typeof getDeckListInsights>;
};

type ActivityDatum = {
  label: string;
  decksCount: number;
  decksShare: number;
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
      <div>Колод: {item.decksCount}</div>
      <div>Доля: {formatPercent(item.decksShare)}</div>
    </div>
  );
}

function formatMedian(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function DeckActivityOverview({ insights }: DeckActivityOverviewProps) {
  return (
    <Card>
      <div className="section-header">
        <div>
          <h2 className="section-header__title">Структура метагейма</h2>
          <p className="section-header__description">
            Показываем типичную выборку колоды, долю устойчивой статистики и
            концентрацию самых популярных архетипов.
          </p>
        </div>
      </div>

      <div className="page-stack">
        <div className="summary-grid">
          <StatCard
            subtitle="Половина колод встретилась не больше этого числа турниров"
            title="Медиана турниров"
            value={formatMedian(insights.medianTournaments)}
          />
          <StatCard
            subtitle="Типичное количество матчей без влияния самых популярных колод"
            title="Медиана матчей"
            value={formatMedian(insights.medianMatches)}
          />
          <StatCard
            subtitle={`${insights.establishedDecksCount} колод прошли порог 30 матчей / 10 турниров`}
            title="Устойчивая статистика"
            value={formatPercent(insights.establishedDecksShare)}
          />
          <StatCard
            subtitle="Доля всех участий, которая приходится на десять самых популярных колод"
            title="Концентрация топ-10"
            value={formatPercent(insights.topTenParticipationsShare)}
          />
        </div>

        <div>
          <div className="section-header">
            <div>
              <h3 className="section-header__title">В скольких турнирах встречались колоды</h3>
              <p className="section-header__description">
                Распределение всех найденных колод по количеству турниров.
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
                  dataKey="decksCount"
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
