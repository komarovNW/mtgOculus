import { Navigate, useLocation } from 'react-router-dom';
import { getDashboardFilterSearch } from '@/shared/lib/filters';

export function HomeRedirect() {
  const location = useLocation();

  return (
    <Navigate
      replace
      to={{
        pathname: '/',
        search: getDashboardFilterSearch(location.search),
      }}
    />
  );
}
