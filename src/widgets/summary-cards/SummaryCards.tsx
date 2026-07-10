import { StatCard } from '@/shared/ui/StatCard';

type SummaryCardsProps = {
  items: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
  }>;
};

export function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <div className="summary-grid">
      {items.map((item, index) => (
        <StatCard
          key={item.title}
          subtitle={item.subtitle}
          title={item.title}
          tone={index === 0 ? 'accent' : 'default'}
          value={item.value}
        />
      ))}
    </div>
  );
}
