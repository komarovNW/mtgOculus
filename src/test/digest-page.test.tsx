import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DigestPage } from '@/pages/digest/DigestPage';

describe('DigestPage', () => {
  it('explains that monthly articles are planned but the screen is not ready yet', () => {
    render(<DigestPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Дайджест' })).toBeInTheDocument();
    expect(screen.getByText('В разработке')).toBeInTheDocument();
    expect(screen.getByText(/ежемесячные разборы статистики Magic Oculus/i)).toBeInTheDocument();
  });
});
