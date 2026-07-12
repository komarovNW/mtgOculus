import { Card } from '@/shared/ui/Card';

type EmptyStateProps = {
  title?: string;
  description: string;
};

export function EmptyState({ title = 'Пока здесь пусто', description }: EmptyStateProps) {
  return (
    <Card className="state-card state-card--empty">
      <h2 className="state-card__title">{title}</h2>
      <p className="state-card__description">{description}</p>
    </Card>
  );
}
