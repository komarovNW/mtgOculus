import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateTournamentPage } from '@/pages/create-tournament/CreateTournamentPage';
import { TestProviders } from '@/test/test-utils';

vi.mock('@/entities/dictionaries/api', () => ({
  getCities: vi.fn().mockResolvedValue({
    items: [{ id: 'moscow', name: 'Москва' }],
  }),
  getClubs: vi.fn().mockResolvedValue({
    items: [{ id: 'club', cityId: 'moscow', name: 'Клуб' }],
  }),
  getFormats: vi.fn().mockResolvedValue({
    items: [{ id: 'legacy', name: 'Legacy' }],
  }),
}));

describe('CreateTournamentPage', () => {
  it('keeps the Aetherhub directory and the complete input guide available', async () => {
    render(
      <TestProviders>
        <CreateTournamentPage />
      </TestProviders>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Добавить' }))
      .toBeInTheDocument();
    expect(screen.getByText('Как добавить событие')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Единорог/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/Edinorog',
    );
    expect(screen.getByRole('link', { name: /Голдфиш/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/goldfish',
    );
    expect(screen.getByRole('link', { name: /Pair of Dice/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/Andysays',
    );
    expect(screen.getByRole('link', { name: /Портал/ })).toHaveAttribute(
      'href',
      'https://aetherhub.com/User/PhillipRus',
    );

    expect(screen.getByText('1. С именами игроков')).toBeInTheDocument();
    expect(screen.getByText('2. Только колоды — по порядку мест')).toBeInTheDocument();
    expect(screen.getByText('Так добавлять нельзя')).toBeInTheDocument();
  });
});
