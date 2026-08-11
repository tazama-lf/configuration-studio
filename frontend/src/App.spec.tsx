import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./shared/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));

vi.mock('./router', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render AppProviders wrapping AppRoutes', () => {
    render(<App />);
    expect(screen.getByTestId('app-providers')).toBeInTheDocument();
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });
});
