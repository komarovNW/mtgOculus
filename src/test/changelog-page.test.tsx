import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { ChangelogPage } from '@/pages/changelog/ChangelogPage';
import { currentAppVersion, releases } from '@/shared/config/releases';

describe('ChangelogPage', () => {
  it('shows the upcoming and first public releases', () => {
    render(<ChangelogPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Что нового' })).toBeInTheDocument();
    expect(screen.getByText('v0.2.0')).toBeInTheDocument();
    expect(screen.getByText('Следующий релиз')).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
    expect(screen.getByText('Первый публичный релиз')).toBeInTheDocument();
  });

  it('keeps package version in sync with the latest release', () => {
    expect(releases[0].version).toBe(currentAppVersion);
    expect(packageJson.version).toBe(currentAppVersion);
  });
});
