import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: ReactNode[];
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badges,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('page-header', className)}>
      <div className="page-header__copy">
        {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
        {badges?.length ? <div className="page-header__badges">{badges}</div> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}

