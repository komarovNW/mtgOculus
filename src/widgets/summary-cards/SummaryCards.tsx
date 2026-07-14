import { cn } from '@/shared/lib/cn';
import { StatCard } from '@/shared/ui/StatCard';

type SummaryCardsProps = {
  title?: string;
  description?: string;
  className?: string;
  items: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    titleHint?: string;
    valueSize?: 'default' | 'compact';
  }>;
};

export function SummaryCards({ title, description, className, items }: SummaryCardsProps) {
  return (
    <div className={cn('page-stack', className)}>
      {title ? (
        <div className="section-header">
          <div>
            <h2 className="section-header__title">{title}</h2>
            {description ? <p className="section-header__description">{description}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="summary-grid">
        {items.map((item, index) => (
          <StatCard
            key={item.title}
            subtitle={item.subtitle}
            title={item.title}
            titleHint={item.titleHint}
            tone={index === 0 ? 'accent' : 'default'}
            value={item.value}
            valueSize={item.valueSize}
          />
        ))}
      </div>
    </div>
  );
}
