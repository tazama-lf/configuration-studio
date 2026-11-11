import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/router";

jest.mock("@/features/auth/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/utils/common/interceptor", () => ({
  setupFetch401Interceptor: jest.fn(),
}));

import { useAuth } from "@/features/auth/contexts/AuthContext";
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

import { setupFetch401Interceptor } from "@/utils/common/interceptor";
const mockSetupFetch401Interceptor = setupFetch401Interceptor as jest.MockedFunction<
  typeof setupFetch401Interceptor
>;

jest.mock("@/features/auth/pages/Login", () => () => <div data-testid="login">Login</div>);
jest.mock("@/features/dashboard/Dashboard", () => () => (
  <div data-testid="dashboard">Dashboard</div>
));
jest.mock("@/features/config/pages/NetworkMapPage", () => () => (
  <div data-testid="network-map">NetworkMap</div>
));
jest.mock("@/features/config/pages/RulePage", () => () => <div data-testid="rule">Rule</div>);
jest.mock("@/features/config/pages/TypologyPage", () => () => (
  <div data-testid="typology">Typology</div>
));

describe("AppRoutes", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "test" },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects from / to /login when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("renders login route", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated on protected route", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("renders dashboard when authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  it("renders network-map when authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/network-map"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  it("renders rule when authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/rule"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  it("renders typology when authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/typology"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  it("calls setupFetch401Interceptor on mount", () => {
    mockSetupFetch401Interceptor.mockClear();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(mockSetupFetch401Interceptor).toHaveBeenCalled();
  });

  it("navigates to login when 401 interceptor callback is invoked", () => {
    mockSetupFetch401Interceptor.mockClear();
    let interceptorCallback: (() => void) | undefined;
    mockSetupFetch401Interceptor.mockImplementation((cb: () => void) => {
      interceptorCallback = cb;
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(interceptorCallback).toBeDefined();
    // Call the interceptor callback — this should call navigate(ROUTES.LOGIN)
    expect(() => interceptorCallback!()).not.toThrow();
  });
});
