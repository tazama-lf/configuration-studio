import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopBar from "@/features/dashboard/components/TopBar";

jest.mock("@/features/dashboard/components/UserCard", () => () => <div data-testid="user-card" />);

describe("TopBar", () => {
  it("renders toggle button", () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("toggle drawer")).toBeInTheDocument();
  });

  it("calls onToggle when toggle clicked", () => {
    const onToggle = jest.fn();
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={onToggle} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("toggle drawer"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders title", () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Tazama Config Studio")).toBeInTheDocument();
  });

  it("renders UserCard", () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("user-card")).toBeInTheDocument();
  });

  it("navigates to dashboard on logo click", () => {
    render(
      <MemoryRouter>
        <TopBar open={false} onToggle={jest.fn()} />
      </MemoryRouter>,
    );
    const logo = screen.getByAltText("Tazama Logo");
    fireEvent.click(logo.closest("div")!);
    expect(logo).toBeInTheDocument();
  });

  it("renders CloseIcon when open is true", () => {
    render(
      <MemoryRouter>
        <TopBar open={true} onToggle={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("toggle drawer")).toBeInTheDocument();
  });
});
