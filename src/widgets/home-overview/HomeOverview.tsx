import { Link } from 'react-router-dom';
import type {
  HomeCityFormatOverviewItem,
  HomeCityOverviewItem,
  HomeClubOverviewItem,
  HomeFormatOverviewItem,
  HomeOverview as HomeOverviewData,
} from '@/shared/api/types';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPercent } from '@/shared/lib/formatPercent';
import { Card } from '@/shared/ui/Card';
import { Table, type TableColumn } from '@/shared/ui/Table';

function homeLink(params: Record<string, string>) {
  return `/?${new URLSearchParams(params).toString()}`;
}

function formatAverage(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);
}

const cityColumns: TableColumn<HomeCityOverviewItem>[] = [
  {
    id: 'city',
    header: 'Город',
    render: (row) => <Link className="entity-link" to={homeLink({ cityId: row.city.id })}>{row.city.name}</Link>,
  },
  { id: 'clubs', header: 'Клубов', align: 'center', render: (row) => row.clubsCount },
  { id: 'dailies', header: 'Дейликов', align: 'center', render: (row) => row.dailiesCount },
  { id: 'tournaments', header: 'Турниров', align: 'center', render: (row) => row.tournamentsCount },
  { id: 'players', header: 'Игроков', align: 'center', render: (row) => row.uniquePlayersCount },
  { id: 'formats', header: 'Форматов', align: 'center', render: (row) => row.formatsCount },
];

const clubColumns: TableColumn<HomeClubOverviewItem>[] = [
  {
    id: 'club',
    header: 'Клуб',
    render: (row) => (
      <div className="stacked-cell">
        <Link className="entity-link" to={homeLink({ cityId: row.city.id, clubId: row.club.id })}>{row.club.name}</Link>
        <span className="entity-cell__meta">{row.city.name}</span>
      </div>
    ),
  },
  { id: 'dailies', header: 'Дейликов', align: 'center', render: (row) => row.dailiesCount },
  { id: 'tournaments', header: 'Турниров', align: 'center', render: (row) => row.tournamentsCount },
  { id: 'players', header: 'Игроков', align: 'center', render: (row) => row.uniquePlayersCount },
  { id: 'average', header: 'В среднем', align: 'center', headerTitle: 'Среднее число игроков на дейлике или турнире.', render: (row) => formatAverage(row.averagePlayersCount) },
  { id: 'formats', header: 'Форматов', align: 'center', render: (row) => row.formatsCount },
];

const formatColumns: TableColumn<HomeFormatOverviewItem>[] = [
  {
    id: 'format',
    header: 'Формат',
    render: (row) => <Link className="entity-link" to={homeLink({ formatId: row.format.id })}>{row.format.name}</Link>,
  },
  { id: 'dailies', header: 'Дейликов', align: 'center', render: (row) => row.dailiesCount },
  { id: 'tournaments', header: 'Турниров', align: 'center', render: (row) => row.tournamentsCount },
  { id: 'participations', header: 'Участий', align: 'center', render: (row) => row.tournamentPlayersCount },
  { id: 'players', header: 'Игроков', align: 'center', render: (row) => row.uniquePlayersCount },
  { id: 'average', header: 'В среднем', align: 'center', headerTitle: 'Среднее число игроков на дейлике или турнире.', render: (row) => formatAverage(row.averagePlayersCount) },
  { id: 'lastDate', header: 'Последняя игра', align: 'center', render: (row) => row.lastTournamentDate ? formatDate(row.lastTournamentDate) : '—' },
];

const cityFormatColumns: TableColumn<HomeCityFormatOverviewItem>[] = [
  {
    id: 'city',
    header: 'Город',
    render: (row) => <Link className="entity-link" to={homeLink({ cityId: row.city.id })}>{row.city.name}</Link>,
  },
  {
    id: 'format',
    header: 'Самый частый формат',
    render: (row) => <Link className="entity-link" to={homeLink({ cityId: row.city.id, formatId: row.leadingFormat.id })}>{row.leadingFormat.name}</Link>,
  },
  { id: 'share', header: 'Доля участий', align: 'center', render: (row) => formatPercent(row.participationShare) },
  {
    id: 'otherFormats',
    header: 'Другие форматы',
    render: (row) => row.otherFormats.length
      ? row.otherFormats.map((format) => format.name).join(', ')
      : '—',
  },
];

type HomeOverviewProps = {
  overview: HomeOverviewData;
};

export function HomeOverview({ overview }: HomeOverviewProps) {
  return (
    <div className="home-overview">
      {(overview.cities.length > 0 || overview.clubs.length > 0) ? (
        <Card>
          <div className="section-header">
            <h2 className="section-header__title">Где играют</h2>
          </div>
          <div className="home-overview__locations">
            {overview.cities.length > 0 ? (
              <section className="home-overview__group">
                <h3>Города</h3>
                <Table
                  accessibleLabel="Статистика по городам"
                  columns={cityColumns}
                  data={overview.cities}
                  emptyMessage="Нет данных по городам."
                  getRowKey={(row) => row.city.id}
                  minWidth={620}
                />
              </section>
            ) : null}
            {overview.clubs.length > 0 ? (
              <section className="home-overview__group">
                <h3>Клубы</h3>
                <Table
                  accessibleLabel="Статистика по клубам"
                  columns={clubColumns}
                  data={overview.clubs}
                  emptyMessage="Нет данных по клубам."
                  getRowKey={(row) => row.club.id}
                  minWidth={660}
                />
              </section>
            ) : null}
          </div>
        </Card>
      ) : null}

      {overview.formats.length > 0 ? (
        <Card>
          <div className="section-header">
            <h2 className="section-header__title">Форматы</h2>
          </div>
          <Table
            accessibleLabel="Общая статистика по форматам"
            columns={formatColumns}
            data={overview.formats}
            emptyMessage="Нет данных по форматам."
            getRowKey={(row) => row.format.id}
            minWidth={760}
          />
        </Card>
      ) : null}

      {overview.cityFormats.length > 0 ? (
        <Card>
          <div className="section-header">
            <h2 className="section-header__title">Что играют в разных городах</h2>
          </div>
          <Table
            accessibleLabel="Популярные форматы по городам"
            columns={cityFormatColumns}
            data={overview.cityFormats}
            emptyMessage="Нет данных о форматах в городах."
            getRowKey={(row) => row.city.id}
            minWidth={680}
          />
        </Card>
      ) : null}
    </div>
  );
}
