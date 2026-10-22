import type { TournamentType } from '@/shared/api/types';
import { getEventStructure } from '@/shared/lib/tournamentResults';
import { EntityLink } from './EntityLink';

export function EventSummary({ event }: { event: {
  id: string; title: string; type: TournamentType; playoffSize?: number | null;
  club?: { name: string }; format?: { name: string };
} }) {
  return <div className="stacked-cell stacked-cell--compact">
    <EntityLink type="tournament" id={event.id} name={event.title} />
    <span className="muted-text">{[getEventStructure(event), event.club?.name, event.format?.name].filter(Boolean).join(' · ')}</span>
  </div>;
}
