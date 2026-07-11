import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RequirePermission } from '@/app/router/RequirePermission';
import type { AuthSession } from '@/shared/auth/model';
import { TestProviders } from '@/test/test-utils';

const adminSession: AuthSession = {
  token: 'test-admin-token',
  signedAt: '2026-07-11T10:00:00.000Z',
  user: {
    id: 'admin',
    login: 'admin',
    name: 'Администратор',
    role: 'admin',
    permissions: ['tournament:create'],
  },
};

function renderAuthRoutes(initialEntry: string, initialSession?: AuthSession | null) {
  render(
    <TestProviders
      initialEntry={initialEntry}
      initialSession={initialSession}
    >
      <Routes>
        <Route
          element={<div>Экран входа</div>}
          path="/login"
        />
        <Route
          element={
            <RequirePermission permission="tournament:create">
              <div>Экран загрузки турнира</div>
            </RequirePermission>
          }
          path="/admin/tournaments/create"
        />
      </Routes>
    </TestProviders>,
  );
}

describe('RequirePermission', () => {
  it('redirects guests to login before opening the admin route', () => {
    renderAuthRoutes('/admin/tournaments/create', null);

    expect(screen.getByText('Экран входа')).toBeInTheDocument();
  });

  it('allows authorized users to open the admin route', () => {
    renderAuthRoutes('/admin/tournaments/create', adminSession);

    expect(screen.getByText('Экран загрузки турнира')).toBeInTheDocument();
  });
});
