import { Link } from 'react-router-dom';
import { buildEntityPath, type EntityType } from '@/shared/lib/entityPaths';

type EntityLinkProps = {
  type: EntityType;
  id?: string | null;
  name: string;
};

export function EntityLink({ type, id, name }: EntityLinkProps) {
  if (!id || id === 'player_bye') {
    return <span className="entity-link entity-link--static">{name}</span>;
  }

  return (
    <Link
      className="entity-link"
      to={buildEntityPath(type, id)}
    >
      {name}
    </Link>
  );
}
