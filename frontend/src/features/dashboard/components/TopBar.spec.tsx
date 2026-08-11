import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./UserCard', () => ({
  default: () => <div data-testid="user-card">UserCard</div>,
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the toggle button', () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('toggle drawer')).toBeInTheDocument();
  });

  it('should render the Tazama Config Studio title', () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Tazama Config Studio')).toBeInTheDocument();
  });

  it('should render UserCard', () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('user-card')).toBeInTheDocument();
  });

  it('should call onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={onToggle} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('toggle drawer'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should navigate to dashboard when logo area is clicked', () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    );
    const logoArea = screen.getByText('Tazama Config Studio').closest('div');
    if (logoArea) {
      fireEvent.click(logoArea);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    }
  });
});
