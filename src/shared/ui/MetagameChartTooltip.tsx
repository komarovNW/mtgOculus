import { formatPercent } from '@/shared/lib/formatPercent';

type MetagameChartDatum = {
  name: string;
  metaShare: number;
  decksCount: number;
};

type MetagameChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: MetagameChartDatum }>;
};

export function MetagameChartTooltip({ active, payload }: MetagameChartTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{item.name}</div>
      <div>Доля меты: {formatPercent(item.metaShare)}</div>
      <div>Количество колод: {item.decksCount}</div>
    </div>
  );
}
