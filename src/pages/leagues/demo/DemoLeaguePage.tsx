import { useMemo, useState } from 'react';
import { calculatePortalAutumnQualification } from '@/entities/league/lib/qualification';
import { LeagueOverview, LeagueStandings } from '@/pages/leagues/LeaguesPage';
import { createDemoLeague, type DemoScenario } from './data';
import { Card } from '@/shared/ui/Card';
import { Select } from '@/shared/ui/Select';
import { PageHeader } from '@/shared/ui/PageHeader';

export function DemoLeaguePage() {
  const [scenario, setScenario] = useState<DemoScenario>('september');
  const league = useMemo(() => calculatePortalAutumnQualification(createDemoLeague(scenario)), [scenario]);
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Локальный просмотр" title="Демо лиги" description="Вымышленные игроки и результаты. Данные не сохраняются и не загружаются с сервера." />
      <Card>
        <Select label="Сценарий" value={scenario} onChange={(event) => setScenario(event.target.value as DemoScenario)} options={[
          { value: 'september', label: 'Сентябрьский Store Championship известен, ноябрьский ещё впереди' },
          { value: 'november', label: 'Оба Store Championship известны, один игрок прошёл дважды' },
          { value: 'tie', label: 'Полное равенство на границе отбора по очкам' },
        ]} />
        <p className="muted-text">Посмотрите «Отбор в финал» или найдите игрока в статистике. В первом сценарии Дмитрий Ветров проходит по очкам, Михаил Соснов — по Podval Points, Виктор Полянский — по посещениям.</p>
      </Card>
      <LeagueOverview league={league} />
      <LeagueStandings league={league} />
    </div>
  );
}
