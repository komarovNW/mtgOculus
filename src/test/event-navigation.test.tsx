import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { EntityLink } from '@/shared/ui/EntityLink';
import { EventLinkScope } from '@/shared/lib/eventLinkScope';
import { getEventListSearch } from '@/shared/lib/filters';
import { EventCountLink } from '@/widgets/home-overview/EventCountLink';
import { TestProviders } from './test-utils';

it('opens a player in the actual event format from a direct tournament link', () => {
  render(<TestProviders initialEntry="/tournaments/756">
    <EventLinkScope.Provider value={{ cityId: 'moscow', formatId: 'standard', tournamentType: 'tournament' }}>
      <EntityLink type="player" id="7" name="Игрок" />
    </EventLinkScope.Provider>
  </TestProviders>);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/players/7?cityId=moscow&formatId=standard&tournamentType=tournament');
});

it('does not carry the opposite type into event lists', () => {
  expect(getEventListSearch('?cityId=moscow&tournamentType=daily', '/tournaments')).toBe('?cityId=moscow');
  expect(getEventListSearch('?tournamentType=tournament', '/dailies')).toBe('');
  expect(getEventListSearch('?tournamentType=tournament', '/players')).toBe('?tournamentType=tournament');
});

it('opens city totals without accidentally narrowing them to default Legacy', () => {
  render(<TestProviders initialEntry="/?formatId=legacy&dateFrom=2026-01-01">
    <EventCountLink count={3} type="tournament" scope={{ cityId: 'moscow' }} />
  </TestProviders>);
  const url = new URL(screen.getByRole('link').getAttribute('href')!, 'http://localhost');
  expect(url.pathname).toBe('/tournaments');
  expect(url.searchParams.get('formatId')).toBe('');
  expect(url.searchParams.get('dateFrom')).toBe('2026-01-01');
});
