import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

export function NotFoundPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Проверьте адрес страницы или вернитесь к разделам со статистикой."
        eyebrow="404"
        title="Страница не найдена"
      />
      <Card>
        <p className="muted-text">
          Похоже, такой страницы сейчас нет. Вернитесь на главную или откройте нужный раздел через верхнее меню.
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
