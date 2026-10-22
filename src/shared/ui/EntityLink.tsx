import { useContext } from 'react';
import { EventLinkScope } from '@/shared/lib/eventLinkScope';
import { Link, useLocation } from 'react-router-dom';
import { buildEntityPath, type EntityType } from '@/shared/lib/entityPaths';
import { getDashboardFilterSearch } from '@/shared/lib/filters';

type EntityLinkProps = {
  type: EntityType;
  id?: string | null;
  name: string;
  colors?: string[] | null;
};

export function EntityLink({ type, id, name }: EntityLinkProps) {
  const location = useLocation();
  const scope = useContext(EventLinkScope);
  const params = new URLSearchParams(getDashboardFilterSearch(location.search));
  if (scope) Object.entries(scope).forEach(([key, value]) => params.set(key, value ?? ''));
  const dashboardFilterSearch = params.toString();

  const content =
    !id || id === 'player_bye' || id === 'player_unknown' ? (
      <span className="entity-link entity-link--static">{name}</span>
    ) : (
      <Link
        className="entity-link"
        to={{
          pathname: buildEntityPath(type, id),
          search: dashboardFilterSearch,
        }}
      >
        {name}
      </Link>
    );

  return content;
}
