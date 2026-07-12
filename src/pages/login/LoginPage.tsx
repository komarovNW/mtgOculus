import { useState } from 'react';
import { useAuth } from '@/app/providers/useAuth';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { PageHeader } from '@/shared/ui/PageHeader';

function getRedirectPath(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    'from' in state &&
    typeof (state as { from?: unknown }).from === 'string' &&
    (state as { from: string }).from !== '/login'
  ) {
    return (state as { from: string }).from;
  }

  return '/admin/tournaments/create';
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = getRedirectPath(location.state);

  if (isAuthenticated) {
    return (
      <Navigate
        replace
        to={redirectPath}
      />
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signIn({ login, password });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Не удалось войти. Проверьте логин и пароль и попробуйте ещё раз.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge
            key="admin"
            variant="warning"
          >
            Служебный вход
          </Badge>,
        ]}
        description="Сейчас вход нужен только для загрузки турниров. Позже через этот же доступ можно будет открыть и другие служебные разделы."
        eyebrow="Авторизация"
        title="Войти"
      />

      <Card tone="muted">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Что будет после входа</h2>
            <p className="section-header__description">
              Сразу после входа откроется экран добавления турнира, где можно загрузить новое событие.
            </p>
          </div>
        </div>
        <p className="muted-text">
          Вся публичная статистика при этом остаётся открытой и доступна без входа.
        </p>
      </Card>

      {errorMessage ? (
        <Card tone="muted">
          <div className="section-header">
            <div>
              <h2 className="section-header__title">Не удалось войти</h2>
              <p className="section-header__description">{errorMessage}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <form
          className="auth-form"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="form-section">
            <h2 className="form-section__title">Вход в служебный раздел</h2>
            <p className="form-section__description">Введите логин и пароль от учётной записи, у которой есть доступ к загрузке турниров.</p>
          </div>

          <div className="auth-form__fields">
            <Input
              autoComplete="username"
              label="Логин"
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Введите логин"
              value={login}
            />
            <Input
              autoComplete="current-password"
              label="Пароль"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль"
              type="password"
              value={password}
            />
          </div>

          <div className="form-actions">
            <Button
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Проверяем данные...' : 'Войти'}
            </Button>
            <Link
              className="button button--ghost section-link"
              to="/"
            >
              На главную
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
