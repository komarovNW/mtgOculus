import { Link, useLocation } from 'react-router-dom';
import { buildEntityPath, type EntityType } from '@/shared/lib/entityPaths';
import { getDashboardFilterSearch } from '@/shared/lib/filters';
import { ManaPips } from '@/shared/ui/ManaPips';

type EntityLinkProps = {
  type: EntityType;
  id?: string | null;
  name: string;
  colors?: string[] | null;
};

export function EntityLink({ type, id, name, colors }: EntityLinkProps) {
  const location = useLocation();
  const dashboardFilterSearch = getDashboardFilterSearch(location.search);

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

  if (type !== 'deck' || !colors?.length) {
    return content;
  }

  return (
    <span className="deck-link">
      {content}
      <ManaPips colors={colors} />
    </span>
  );
}
