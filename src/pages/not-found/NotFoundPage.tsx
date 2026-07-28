import { Link, useLocation } from 'react-router-dom';
import { getDashboardFilterSearch } from '@/shared/lib/filters';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="page-stack">
      <PageHeader
        description="Проверьте ссылку или вернитесь к одному из разделов со статистикой."
        eyebrow="404"
        title="Страница не найдена"
      />
      <Card>
        <p className="muted-text">
          Такой страницы сейчас нет. Можно вернуться на главную или перейти в нужный раздел через верхнее меню.
        </p>
        <div className="form-actions">
          <Link
            className="button button--primary"
            to={{
              pathname: '/',
              search: getDashboardFilterSearch(location.search),
            }}
          >
            На главную
          </Link>
        </div>
      </Card>
    </div>
  );
}
