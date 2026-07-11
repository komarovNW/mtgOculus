import { Link, useLocation } from 'react-router-dom';
import { buildEntityPath, type EntityType } from '@/shared/lib/entityPaths';
import { ManaPips } from '@/shared/ui/ManaPips';

type EntityLinkProps = {
  type: EntityType;
  id?: string | null;
  name: string;
  colors?: string[] | null;
};

export function EntityLink({ type, id, name, colors }: EntityLinkProps) {
  const location = useLocation();

  const content =
    !id || id === 'player_bye' ? (
      <span className="entity-link entity-link--static">{name}</span>
    ) : (
      <Link
        className="entity-link"
        to={{
          pathname: buildEntityPath(type, id),
          search: location.search,
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
