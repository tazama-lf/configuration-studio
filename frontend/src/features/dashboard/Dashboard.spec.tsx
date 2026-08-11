import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';

vi.mock('./components/TopBar', () => ({
  default: ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
    <button data-testid="topbar-toggle" onClick={onToggle}>
      Toggle (open: {String(open)})
    </button>
  ),
}));

vi.mock('./components/SideNav', () => ({
  default: ({ open, onClose }: { open: boolean; onClose?: () => void }) => (
    <div data-testid="sidenav" data-open={String(open)}>
      <button data-testid="sidenav-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('./components/DashboardBoxes', () => ({
  default: () => <div data-testid="dashboard-boxes">Boxes</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the TopBar toggle button', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('topbar-toggle')).toBeInTheDocument();
  });

  it('should render SideNav', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('sidenav')).toBeInTheDocument();
  });

  it('should toggle open state when TopBar toggle is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    const toggleBtn = screen.getByTestId('topbar-toggle');
    expect(toggleBtn.textContent).toContain('false');
    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toContain('true');
  });

  it('should close drawer when SideNav onClose is called', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    const toggleBtn = screen.getByTestId('topbar-toggle');
    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toContain('true');

    fireEvent.click(screen.getByTestId('sidenav-close'));
    expect(toggleBtn.textContent).toContain('false');
  });

  it('should render DashboardBoxes on /dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('dashboard-boxes')).toBeInTheDocument();
  });

  it('should not render DashboardBoxes on non-dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/network-map']}>
        <Routes>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('dashboard-boxes')).not.toBeInTheDocument();
  });
});
