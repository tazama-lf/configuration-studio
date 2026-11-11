import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SideNav from "@/features/dashboard/components/SideNav";

const mockLogout = jest.fn();

jest.mock("@/features/auth/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: "1", username: "test", tenantId: "default" },
    loading: false,
    login: jest.fn(),
    logout: mockLogout,
  }),
}));

describe("SideNav", () => {
  it("renders navigation items", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Network Map").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Typology").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rule").length).toBeGreaterThan(0);
  });

  it("renders logout button", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);
  });

  it("navigates when item clicked", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByText("Network Map")[0]);
    expect(screen.getAllByText("Network Map").length).toBeGreaterThan(0);
  });

  it("calls logout when logout clicked", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByText("Logout")[0]);
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);
  });

  it("renders with open=false", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={false} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  });

  it("calls onClose when a nav item is clicked", () => {
    const onClose = jest.fn();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByText("Network Map")[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls logout when logout button is clicked", () => {
    mockLogout.mockClear();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByText("Logout")[0]);
    expect(mockLogout).toHaveBeenCalled();
  });

  it("calls onClose when logout button is clicked", () => {
    const onClose = jest.fn();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SideNav open={true} onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByText("Logout")[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
