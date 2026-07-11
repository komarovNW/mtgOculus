import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/useAuth';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/cn';

const publicLinks = [
  { to: '/', label: 'Главная', end: true },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/players', label: 'Игроки' },
  { to: '/decks', label: 'Колоды' },
];

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'magic-oculus-theme';

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return 'light';
}

export function AppLayout() {
  const navigate = useNavigate();
  const { hasPermission, isAuthenticated, signOut, user } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const canCreateTournament = hasPermission('tournament:create');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleSignOut() {
    signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand">
            <div className="brand__eyebrow">Турниры, колоды и мета</div>
            <NavLink
              className="brand__title"
              to="/"
            >
              Magic Oculus
            </NavLink>
          </div>
          <div className="site-header__actions">
            <nav className="site-nav">
              {publicLinks.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) => `site-nav__link ${isActive ? 'site-nav__link--active' : ''}`}
                  end={link.end}
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
              {canCreateTournament ? (
                <NavLink
                  className={({ isActive }) => `site-nav__link ${isActive ? 'site-nav__link--active' : ''}`}
                  to="/admin/tournaments/create"
                >
                  Добавить турнир
                </NavLink>
              ) : null}
            </nav>
            <div className="header-session">
              {isAuthenticated && user ? (
                <>
                  <div className="header-session__summary">
                    <Badge variant="accent">Авторизован</Badge>
                    <span className="header-session__user">{user.name}</span>
                  </div>
                  <button
                    className="button button--ghost"
                    onClick={handleSignOut}
                    type="button"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  className="button button--ghost section-link"
                  state={{ from: '/admin/tournaments/create' }}
                  to="/login"
                >
                  Войти
                </Link>
              )}
            </div>
            <div
              aria-label="Переключение темы"
              className="theme-switch"
              role="group"
            >
              <button
                aria-pressed={theme === 'light'}
                className={cn('theme-switch__button', theme === 'light' && 'theme-switch__button--active')}
                onClick={() => setTheme('light')}
                type="button"
              >
                Светлая
              </button>
              <button
                aria-pressed={theme === 'dark'}
                className={cn('theme-switch__button', theme === 'dark' && 'theme-switch__button--active')}
                onClick={() => setTheme('dark')}
                type="button"
              >
                Тёмная
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          Magic Oculus показывает статистику турниров, колод, игроков и матчапов по загруженным событиям Magic: The
          Gathering.
        </div>
      </footer>
    </div>
  );
}
