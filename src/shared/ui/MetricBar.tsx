import { cn } from '@/shared/lib/cn';

type MetricBarProps = {
  value: number;
  label?: string;
  title?: string;
  tone?: 'accent' | 'warning';
  compact?: boolean;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function MetricBar({
  value,
  label,
  title,
  tone = 'accent',
  compact = false,
}: MetricBarProps) {
  const safeValue = clampPercent(value);

  return (
    <div
      className={cn('metric-bar', compact && 'metric-bar--compact')}
      title={title}
    >
      <div className="metric-bar__track">
        <div
          className={cn('metric-bar__fill', `metric-bar__fill--${tone}`)}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {label ? <span className="metric-bar__label">{label}</span> : null}
    </div>
  );
}
