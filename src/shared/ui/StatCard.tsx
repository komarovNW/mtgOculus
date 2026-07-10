import { Card } from '@/shared/ui/Card';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'muted' | 'accent';
};

export function StatCard({ title, value, subtitle, tone = 'default' }: StatCardProps) {
  return (
    <Card
      className="stat-card"
      tone={tone}
    >
      <div className="stat-card__label">{title}</div>
      <div className="stat-card__value">{value}</div>
      {subtitle ? <div className="stat-card__subtitle">{subtitle}</div> : null}
    </Card>
  );
}
