import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppRoutes } from './index';

vi.mock('../features/auth/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    loading: false,
  })),
}));

vi.mock('../features/auth/pages/Login', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('../features/dashboard/Dashboard', () => ({
  default: () => (
    <div data-testid="dashboard">
      Dashboard
      <Outlet />
    </div>
  ),
}));

vi.mock('../features/config/pages/NetworkMapPage', () => ({
  default: () => <div data-testid="network-map-page">NetworkMap</div>,
}));

vi.mock('../features/config/pages/RulePage', () => ({
  default: () => <div data-testid="rule-page">Rule</div>,
}));

vi.mock('../features/config/pages/TypologyPage', () => ({
  default: () => <div data-testid="typology-page">Typology</div>,
}));

vi.mock('../utils/common/interceptor', () => ({
  setupFetch401Interceptor: vi.fn(),
}));

import { useAuth } from '../features/auth/contexts/AuthContext';

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redirect from / to /login', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should render Login page on /login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated and accessing protected route', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should render Dashboard when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'test' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should render NetworkMap page when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'test' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/network-map']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('network-map-page')).toBeInTheDocument();
  });

  it('should render Rule page when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'test' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/rule']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('rule-page')).toBeInTheDocument();
  });

  it('should render Typology page when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'test' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/typology']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('typology-page')).toBeInTheDocument();
  });

  it('should show loading spinner when loading is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect unknown routes to login', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
