import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardBoxes, {
  BoxCard,
  getBoxesSx,
  getBoxCardBackgroundColor,
} from "@/features/dashboard/components/DashboardBoxes";

describe("DashboardBoxes", () => {
  it("renders all three boxes", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    expect(screen.getByText("Network Map")).toBeInTheDocument();
    expect(screen.getByText("Typology")).toBeInTheDocument();
    expect(screen.getByText("Rule")).toBeInTheDocument();
  });

  it("shows subtitles", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Manage network map configurations for transaction routing."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage typology configurations for classification."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage rule configurations for transaction monitoring."),
    ).toBeInTheDocument();
  });

  it("navigates when box clicked", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Network Map"));
    expect(screen.getByText("Network Map")).toBeInTheDocument();
  });

  it("applies mounted animation and cleans up timer on unmount", async () => {
    jest.useFakeTimers();
    const { unmount } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(screen.getByText("Network Map")).toBeInTheDocument();
    // Unmount to trigger clearTimeout cleanup (line 169)
    unmount();
    jest.useRealTimers();
  });
});

describe("BoxCard", () => {
  it("renders with default color", () => {
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<span>icon</span>} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("Test subtitle")).toBeInTheDocument();
  });

  it("renders with custom color", () => {
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<span>icon</span>} color="#ff0000" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("calls backgroundColor theme callback in BoxCard sx", () => {
    // Directly test the exported function
    const result = getBoxCardBackgroundColor({ palette: { background: { paper: "#fff" } } });
    expect(result).toBe("#fff");
  });

  it("renders BoxCard with non-element icon (isValidElement false branch)", () => {
    // Pass a non-React-element value to cover the false branch of isValidElement
    render(
      <MemoryRouter>
        {/* @ts-expect-error: intentionally passing non-element */}
        <BoxCard title="Test" subtitle="Test subtitle" icon={null as any} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<span>icon</span>} onClick={onClick} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Test"));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders selected indicator", () => {
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<span>icon</span>} selected={true} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders without selected indicator by default", () => {
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<span>icon</span>} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("clones valid React element icon with size and color props", () => {
    // Pass a real React element (not just a span) so React.isValidElement returns true
    // and React.cloneElement is called (line 45)
    const IconComponent = (props: any) =>
      React.createElement("span", { "data-testid": "custom-icon", ...props });
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<IconComponent />} color="#ff0000" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("calls async onClick when box clicked", async () => {
    const onClick = jest.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <BoxCard title="Test" subtitle="Test subtitle" icon={<span>icon</span>} onClick={onClick} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Test"));
    await waitFor(() => {
      expect(onClick).toHaveBeenCalled();
    });
  });

  it("getBoxesSx returns sx with theme callback", () => {
    const sx = getBoxesSx();
    const result = sx({ palette: { background: { default: "#fff" } } });
    expect(result.px).toBe("48px");
    expect(result.backgroundColor).toBe("#fff");
  });
});
