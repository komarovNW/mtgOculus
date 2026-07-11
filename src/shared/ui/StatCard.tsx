import { Card } from '@/shared/ui/Card';
import { InfoHint } from '@/shared/ui/InfoHint';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'muted' | 'accent';
  titleHint?: string;
};

export function StatCard({ title, value, subtitle, tone = 'default', titleHint }: StatCardProps) {
  return (
    <Card
      className="stat-card"
      tone={tone}
    >
      <div className="stat-card__label">
        <span>{title}</span>
        {titleHint ? <InfoHint text={titleHint} /> : null}
      </div>
      <div className="stat-card__value">{value}</div>
      {subtitle ? <div className="stat-card__subtitle">{subtitle}</div> : null}
    </Card>
  );
}
