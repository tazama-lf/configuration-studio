import React from "react";
import { render } from "@testing-library/react";
import NavListItemButton from "@/features/dashboard/components/NavListItemButton";

describe("NavListItemButton", () => {
  it("renders children", () => {
    const { container } = render(
      <NavListItemButton>
        <span>Test</span>
      </NavListItemButton>,
    );
    expect(container).toBeTruthy();
  });

  it("renders with open prop", () => {
    const { container } = render(
      <NavListItemButton open={true}>
        <span>Test</span>
      </NavListItemButton>,
    );
    expect(container).toBeTruthy();
  });

  it("renders with open=false", () => {
    const { container } = render(
      <NavListItemButton open={false}>
        <span>Test</span>
      </NavListItemButton>,
    );
    expect(container).toBeTruthy();
  });
});
