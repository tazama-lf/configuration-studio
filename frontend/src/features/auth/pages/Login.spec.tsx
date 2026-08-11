import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import Login from './Login';

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    user: null,
    loading: false,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthApiService.decodeToken
vi.mock('../services/authApi', () => ({
  AuthApiService: {
    decodeToken: vi.fn(() => ({ id: '1', username: 'test@example.com' })),
  },
}));

// Mock assets
vi.mock('@assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('@assets/tazamaLogo.svg', () => ({ default: 'tazamaLogo.svg' }));
vi.mock('@assets/treeImage.png', () => ({ default: 'treeImage.png' }));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render the login form with email and password fields', () => {
      renderLogin();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('should render the Login button', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('should render the heading "Tazama Config Studio"', () => {
      renderLogin();
      expect(screen.getByText('Tazama Config Studio')).toBeInTheDocument();
    });

    it('should render the subtitle text', () => {
      renderLogin();
      expect(
        screen.getByText(/Please Enter Your Login Credentials/i),
      ).toBeInTheDocument();
    });

    it('should render the Apache license link', () => {
      renderLogin();
      const link = screen.getByText('Apache-2.0');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href');
    });

    it('should render copyright text', () => {
      renderLogin();
      expect(screen.getByText(/LF Charities, Inc/i)).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show validation error when email is empty', async () => {
      renderLogin();
      const submitButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errors = screen.getAllByText(/This Field is Required/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should show validation error for invalid email format', async () => {
      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/A valid email address is required/i),
        ).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Must be at least 6 characters/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Password visibility toggle', () => {
    it('should toggle password visibility when eye icon is clicked', () => {
      renderLogin();
      const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // The eye toggle is the IconButton inside the password InputAdornment
      // Find it by looking for a button that's within the password field's container
      const passwordField = passwordInput.closest('.MuiInputBase-root');
      expect(passwordField).not.toBeNull();
      const eyeButton = passwordField!.querySelector('button');
      expect(eyeButton).not.toBeNull();
      fireEvent.click(eyeButton!);
      expect(passwordInput.type).toBe('text');
    });
  });

  describe('Form submission', () => {
    it('should call login and navigate on successful login', async () => {
      mockLogin.mockResolvedValue(true);
      localStorage.setItem('authToken', 'fake-token');

      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
          replace: true,
        });
      });
    });

    it('should show error message on login failure (returns false)', async () => {
      mockLogin.mockResolvedValue(false);

      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid credentials/i),
        ).toBeInTheDocument();
      });
    });

    it('should show error message when login throws unauthorized error', async () => {
      mockLogin.mockRejectedValue(new Error('Unauthorized access'));

      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid credentials/i),
        ).toBeInTheDocument();
      });
    });

    it('should show connection error for non-auth errors', async () => {
      mockLogin.mockRejectedValue(new Error('Network failure'));

      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Login failed/i),
        ).toBeInTheDocument();
      });
    });

    it('should navigate to dashboard even without token in localStorage', async () => {
      mockLogin.mockResolvedValue(true);
      localStorage.removeItem('authToken');

      renderLogin();
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
          replace: true,
        });
      });
    });
  });
});
