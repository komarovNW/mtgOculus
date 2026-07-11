import type { ReactNode } from 'react';
import { useAuth } from '@/app/providers/useAuth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { AuthPermission } from '@/shared/auth/model';
import { ErrorState } from '@/shared/ui/ErrorState';

type RequirePermissionProps = {
  permission?: AuthPermission;
  children?: ReactNode;
};

function buildRedirectTarget(pathname: string, search: string, hash: string) {
  const target = `${pathname}${search}${hash}`;

  return target === '/login' ? '/admin/tournaments/create' : target;
}

export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const location = useLocation();
  const { hasPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: buildRedirectTarget(location.pathname, location.search, location.hash) }}
        to="/login"
      />
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <ErrorState
        description="У этой учётной записи пока нет доступа к этому разделу."
        title="Доступ закрыт"
      />
    );
  }

  return children ?? <Outlet />;
}
