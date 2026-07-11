import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from '@/pages/home/HomePage';
import { TestProviders } from '@/test/test-utils';

describe('HomePage', () => {
  it('renders dashboard sections in mock mode', async () => {
    render(
      <TestProviders initialEntry="/?cityId=moscow&formatId=legacy">
        <HomePage />
      </TestProviders>,
    );

    expect(screen.getByText('Legacy в Москве')).toBeInTheDocument();
    expect(await screen.findByText('Последние турниры')).toBeInTheDocument();
    expect(screen.getByText('Как выступают колоды')).toBeInTheDocument();
  });
});
