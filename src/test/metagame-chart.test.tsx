import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatChartDeckName } from '@/shared/lib/formatChartDeckName';
import { MetagameChartTooltip } from '@/shared/ui/MetagameChartTooltip';

describe('metagame chart presentation', () => {
  it('uses readable labels in the tooltip', () => {
    render(
      <MetagameChartTooltip
        active
        payload={[{ payload: { name: 'Grixis Reanimator', metaShare: 7.2, decksCount: 3 } }]}
      />,
    );

    const tooltip = screen.getByText('Grixis Reanimator').parentElement;

    expect(tooltip).toHaveTextContent('Доля меты: 7.2%');
    expect(tooltip).toHaveTextContent('Количество колод: 3');
  });

  it('shortens only long axis labels', () => {
    expect(formatChartDeckName('Eldrazi')).toBe('Eldrazi');
    expect(formatChartDeckName('Very long archetype name')).toBe('Very long archety…');
  });
});
