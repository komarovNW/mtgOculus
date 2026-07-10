import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Главная', end: true },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/players', label: 'Игроки' },
  { to: '/decks', label: 'Колоды' },
  { to: '/admin/tournaments/create', label: 'Добавить турнир' },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand">
            <div className="brand__eyebrow">MTG Global Stats MVP</div>
            <NavLink
              className="brand__title"
              to="/"
            >
              Magic Oculus
            </NavLink>
          </div>
          <nav className="site-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                className={({ isActive }) => `site-nav__link ${isActive ? 'site-nav__link--active' : ''}`}
                end={link.end}
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          Magic Oculus показывает статистику турниров по Magic: The Gathering в адаптивном dashboard-интерфейсе.
        </div>
      </footer>
    </div>
  );
}

