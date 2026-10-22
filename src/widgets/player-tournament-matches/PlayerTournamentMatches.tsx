import type { TournamentDetailsResponse, TournamentStandingItem } from '@/shared/api/types';
import { getPlayerTournamentMatches } from '@/shared/lib/tournamentExploration';
import { Badge } from '@/shared/ui/Badge';
import { EntityLink } from '@/shared/ui/EntityLink';
import { Table } from '@/shared/ui/Table';

export function PlayerTournamentMatches({ details, standing }: { details: TournamentDetailsResponse; standing: TournamentStandingItem }) {
  return (
    <section className="tournament-player-matches" id={`matches-${standing.player.id}`} aria-label={`Матчи: ${standing.player.name}`}>
      <div className="section-header">
        <div>
          <h3 className="section-header__title">Матчи</h3>
          <p className="section-header__description">Счёт указан с позиции выбранного игрока.</p>
        </div>
      </div>
      <Table
        data={getPlayerTournamentMatches(details, standing.player.id)}
        getRowKey={(row) => row.key}
        emptyMessage="Матчи этого игрока пока не загружены."
        accessibleLabel={`Матчи игрока ${standing.player.name}`}
        columns={[
          { id: 'stage', header: 'Раунд / стадия', render: (row) => row.stage },
          { id: 'opponent', header: 'Соперник', render: (row) => row.kind === 'bye' ? 'Без соперника' : row.kind === 'unknown' ? 'Не указан' : <EntityLink type="player" id={row.opponent.id} name={row.opponent.name} /> },
          { id: 'deck', header: 'Колода соперника', render: (row) => row.opponent.deck ? <EntityLink type="deck" id={row.opponent.deck.id} name={row.opponent.deck.name} /> : '—' },
          { id: 'score', header: 'Счёт', align: 'center', render: (row) => row.score },
          { id: 'result', header: 'Результат', render: (row) => <Badge variant={row.result === 'Победа' ? 'accent' : 'neutral'}>{row.result}</Badge> },
        ]}
      />
    </section>
  );
}
