import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SideNav from './SideNav';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../auth/contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
    isAuthenticated: true,
    user: { id: '1', username: 'test' },
    loading: false,
  }),
}));

describe('SideNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render all navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    expect(screen.getAllByLabelText('Navigate to Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Navigate to Network Map').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Navigate to Typology').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Navigate to Rule').length).toBeGreaterThan(0);
  });

  it('should render logout button', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    expect(screen.getAllByLabelText('Logout').length).toBeGreaterThan(0);
  });

  it('should navigate when a nav item is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByLabelText('Navigate to Network Map')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/network-map');
  });

  it('should call onClose when a nav item is clicked', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNav open={true} onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByLabelText('Navigate to Rule')[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should logout and navigate to login when logout is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByLabelText('Logout')[0]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
