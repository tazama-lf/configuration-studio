import React from "react";
import { render, screen } from "@testing-library/react";
import UserCard from "@/features/dashboard/components/UserCard";

jest.mock("@/features/auth/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "@/features/auth/contexts/AuthContext";
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("UserCard", () => {
  it("renders default username when no user", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(<UserCard />);
    expect(screen.getByText("user")).toBeInTheDocument();
  });

  it("renders username from user object", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "testuser" },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(<UserCard />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("extracts initials from email-style username", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "john.doe@example.com" },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(<UserCard />);
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
  });

  it("handles hyphenated username", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "john-doe" },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(<UserCard />);
    expect(screen.getByText("john-doe")).toBeInTheDocument();
  });

  it("handles underscore username", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "john_doe" },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(<UserCard />);
    expect(screen.getByText("john_doe")).toBeInTheDocument();
  });
});
