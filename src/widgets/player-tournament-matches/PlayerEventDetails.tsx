import { useQuery } from '@tanstack/react-query';
import { getTournamentDetails } from '@/entities/tournament/api';
import { getEventStructure } from '@/shared/lib/tournamentResults';
import { LoadingState } from '@/shared/ui/LoadingState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PlayerTournamentMatches } from './PlayerTournamentMatches';

export function PlayerEventDetails({ tournamentId, playerId }: { tournamentId: string; playerId: string }) {
  const query = useQuery({
    queryKey: ['tournament-detail', tournamentId],
    queryFn: ({ signal }) => getTournamentDetails(tournamentId, { signal }),
  });
  if (query.isPending) return <LoadingState description="Загружаем выступление игрока." />;
  if (query.isError) return <ErrorState title="Не удалось загрузить выступление" description="Повторите запрос, чтобы увидеть места и матчи игрока." onRetry={() => { void query.refetch(); }} />;
  const standing = query.data.standings.find((row) => row.player.id === playerId);
  if (!standing) return <p>Игрок не найден в результатах этого события.</p>;
  return <div className="player-event-details">
    <p className="muted-text">
      {getEventStructure(query.data.tournament)} · Итоговое место: {standing.rank}
      {standing.swissRank != null ? ` · Место после швейцарки: ${standing.swissRank}` : ''}
    </p>
    <PlayerTournamentMatches details={query.data} standing={standing} />
  </div>;
}
