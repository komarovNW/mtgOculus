import { Card } from '@/shared/ui/Card';

type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = 'Загрузка...',
  description = 'Подготавливаем статистику и таблицы.',
}: LoadingStateProps) {
  return (
    <Card className="state-card state-card--loading">
      <div className="loading-spinner" />
      <div>
        <h2 className="state-card__title">{title}</h2>
        <p className="state-card__description">{description}</p>
      </div>
    </Card>
  );
}

