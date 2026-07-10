import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

export function NotFoundPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Проверьте адрес или вернитесь к главной аналитике."
        eyebrow="404"
        title="Страница не найдена"
      />
      <Card>
        <p className="muted-text">
          Запрошенный маршрут отсутствует в текущем MVP. Основные разделы доступны из верхней навигации.
        </p>
        <div className="form-actions">
          <Link
            className="button button--primary"
            to="/"
          >
            На главную
          </Link>
        </div>
      </Card>
    </div>
  );
}

