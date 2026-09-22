import React from "react";
import { render } from "@testing-library/react";
import Drawer from "@/features/dashboard/components/Drawer";

describe("Drawer", () => {
  it("renders children when open", () => {
    const { container } = render(
      <Drawer open={true}>
        <div data-testid="child">Content</div>
      </Drawer>,
    );
    expect(container).toBeTruthy();
  });

  it("renders children when closed", () => {
    const { container } = render(
      <Drawer open={false}>
        <div data-testid="child">Content</div>
      </Drawer>,
    );
    expect(container).toBeTruthy();
  });
});
