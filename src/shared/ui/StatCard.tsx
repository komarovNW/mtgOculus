import { Card } from '@/shared/ui/Card';
import { InfoHint } from '@/shared/ui/InfoHint';
import { cn } from '@/shared/lib/cn';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'muted' | 'accent';
  titleHint?: string;
  valueSize?: 'default' | 'compact';
};

export function StatCard({ title, value, subtitle, tone = 'default', titleHint, valueSize = 'default' }: StatCardProps) {
  return (
    <Card
      className="stat-card"
      tone={tone}
    >
      <div className="stat-card__label">
        <span>{title}</span>
        {titleHint ? <InfoHint text={titleHint} /> : null}
      </div>
      <div className={cn('stat-card__value', valueSize === 'compact' && 'stat-card__value--compact')}>{value}</div>
      {subtitle ? <div className="stat-card__subtitle">{subtitle}</div> : null}
    </Card>
  );
}
