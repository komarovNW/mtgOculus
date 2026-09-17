import type { DeckShort } from '@/shared/api/types';
import { Card } from '@/shared/ui/Card';
import { EntityLink } from '@/shared/ui/EntityLink';

type RelationshipHighlightItem = {
  label: string;
  entity: {
    id: string;
    name: string;
    colors?: DeckShort['colors'];
  };
  entityType: 'deck' | 'player';
  detail: string;
};

type RelationshipHighlightsProps = {
  title: string;
  items: RelationshipHighlightItem[];
};

export function RelationshipHighlights({ title, items }: RelationshipHighlightsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="relationship-highlights">
      <div className="section-header">
        <h2 className="section-header__title">{title}</h2>
      </div>
      <div className="relationship-highlights__grid">
        {items.map((item) => (
          <article className="relationship-highlight" key={item.label}>
            <div className="relationship-highlight__label">{item.label}</div>
            <EntityLink
              colors={item.entity.colors}
              id={item.entity.id}
              name={item.entity.name}
              type={item.entityType}
            />
            <div className="relationship-highlight__detail">{item.detail}</div>
          </article>
        ))}
      </div>
    </Card>
  );
}
