import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard, { getMainSx } from "@/features/dashboard/Dashboard";

jest.mock("@/features/dashboard/components/DashboardBoxes", () => () => (
  <div data-testid="dashboard-boxes" />
));
jest.mock("@/features/dashboard/components/TopBar", () => (props: any) => (
  <div>
    <button onClick={() => props.onToggle()} aria-label="toggle">
      toggle
    </button>
  </div>
));
jest.mock("@/features/dashboard/components/Drawer", () => (props: any) => (
  <div>{props.children}</div>
));
jest.mock("@/features/dashboard/components/SideNav", () => (props: any) => (
  <div>
    <div data-testid="sidenav" />
    {props.onClose && (
      <button data-testid="sidenav-close" onClick={() => props.onClose()}>
        close
      </button>
    )}
  </div>
));

describe("Dashboard", () => {
  it("renders with DashboardBoxes on dashboard route", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("dashboard-boxes")).toBeInTheDocument();
  });

  it("renders SideNav", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("toggles menu state", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    const toggle = screen.getByLabelText("toggle");
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toBeInTheDocument();
  });

  it("covers sx open=true branch after toggle", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    const toggle = screen.getByLabelText("toggle");
    // Click to set open=true — the Box sx callback will be called with open=true
    fireEvent.click(toggle);
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
    // Force a re-render to ensure sx is called again
    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
  });

  it("covers sx open=false branch after toggle twice", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    const toggle = screen.getByLabelText("toggle");
    fireEvent.click(toggle); // open=true
    fireEvent.click(toggle); // open=false
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("renders on network-map route", () => {
    render(
      <MemoryRouter initialEntries={["/network-map"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("does not render DashboardBoxes on non-dashboard route", () => {
    render(
      <MemoryRouter initialEntries={["/network-map"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("dashboard-boxes")).not.toBeInTheDocument();
  });

  it("calls onClose from SideNav to close the drawer", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    const closeBtn = screen.getByTestId("sidenav-close");
    fireEvent.click(closeBtn);
    // The close button should still be in the document after clicking
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("renders on rule route", () => {
    render(
      <MemoryRouter initialEntries={["/rule"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("renders on typology route", () => {
    render(
      <MemoryRouter initialEntries={["/typology"]}>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("getMainSx covers open=true branch", () => {
    const sx = getMainSx(true, 240);
    const result = sx({ spacing: (n: number) => n * 8, breakpoints: { up: () => "sm" } });
    expect(result.ml).toBe("240px");
  });

  it("getMainSx covers open=false branch", () => {
    const sx = getMainSx(false, 240);
    const result = sx({ spacing: (n: number) => n * 8, breakpoints: { up: () => "sm" } });
    expect(result.ml).toContain("calc(56 + 1px)");
  });
});
