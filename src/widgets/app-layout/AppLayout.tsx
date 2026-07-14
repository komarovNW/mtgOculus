import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { getDashboardFilterSearch } from '@/shared/lib/filters';

type HeaderLink = {
  to: string;
  label: string;
  end?: boolean;
  preserveFilters?: boolean;
};

const publicLinks: HeaderLink[] = [
  { to: '/', label: 'Главная', end: true },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/players', label: 'Игроки' },
  { to: '/decks', label: 'Колоды' },
];

const headerLinks: HeaderLink[] = [
  ...publicLinks,
  { to: '/admin/tournaments/create', label: 'Добавить турнир', preserveFilters: false },
];

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'magic-oculus-theme';
const MOBILE_NAV_BREAKPOINT = 760;

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
  const location = useLocation();
  const dashboardFilterSearch = getDashboardFilterSearch(location.search);
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    function handleResize() {
      if (window.innerWidth > MOBILE_NAV_BREAKPOINT) {
        setIsMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__top">
            <div className="brand">
              <div className="brand__eyebrow">Турниры, колоды и статистика</div>
              <NavLink
                className="brand__title"
                to={{ pathname: '/', search: dashboardFilterSearch }}
              >
                Magic Oculus
              </NavLink>
            </div>
            <button
              aria-controls="site-navigation"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              className={cn('site-header__menu-button', isMobileMenuOpen && 'site-header__menu-button--open')}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="site-header__menu-icon"
              >
                <span />
                <span />
                <span />
              </span>
              <span className="site-header__menu-label">Меню</span>
            </button>
          </div>

          <div className={cn('site-header__actions', isMobileMenuOpen && 'site-header__actions--open')}>
            <nav
              className="site-nav"
              id="site-navigation"
            >
              {headerLinks.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) => `site-nav__link ${isActive ? 'site-nav__link--active' : ''}`}
                  end={link.end}
                  to={{
                    pathname: link.to,
                    search: link.preserveFilters === false ? '' : dashboardFilterSearch,
                  }}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
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
          Magic Oculus собирает в одном месте результаты турниров, колоды, игроков и матчапы по загруженным событиям
          Magic: The Gathering.
        </div>
      </footer>
    </div>
  );
}
