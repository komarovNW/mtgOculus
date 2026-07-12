import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Не удалось загрузить данные',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="state-card state-card--error">
      <h2 className="state-card__title">{title}</h2>
      <p className="state-card__description">{description}</p>
      {onRetry ? (
        <div className="state-card__actions">
          <Button
            variant="secondary"
            onClick={onRetry}
          >
            Попробовать ещё раз
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
