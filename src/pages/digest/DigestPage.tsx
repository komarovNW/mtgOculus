import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

export function DigestPage() {
  return (
    <div className="page-stack">
      <PageHeader
        badges={[
          <Badge
            key="status"
            variant="warning"
          >
            В разработке
          </Badge>,
        ]}
        description="Здесь смогут выходить ежемесячные статьи с разбором метагейма, результатов колод, игроков и главных событий прошедшего месяца."
        eyebrow="Статьи по статистике"
        title="Дайджест"
      />

      <Card tone="muted">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">Пока здесь ничего нет</h2>
            <p className="section-header__description">
              Экран в разработке. Возможно, когда-нибудь здесь появятся ежемесячные разборы статистики Magic Oculus.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
