import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserCard from './UserCard';

const mockUseAuth = vi.fn();
vi.mock('../../auth/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('UserCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render default "user" when no user is set', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(
      <MemoryRouter>
        <UserCard />
      </MemoryRouter>,
    );
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('should render the username from auth context', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'john.doe@example.com' },
    });
    render(
      <MemoryRouter>
        <UserCard />
      </MemoryRouter>,
    );
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('should show initials derived from username', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'john.doe@example.com' },
    });
    render(
      <MemoryRouter>
        <UserCard />
      </MemoryRouter>,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should handle username with hyphens', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'john-doe@test.com' },
    });
    render(
      <MemoryRouter>
        <UserCard />
      </MemoryRouter>,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should handle username with underscores', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'john_doe@test.com' },
    });
    render(
      <MemoryRouter>
        <UserCard />
      </MemoryRouter>,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
