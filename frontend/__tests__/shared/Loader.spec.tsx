import React from "react";
import { render } from "@testing-library/react";
import Loader from "@/shared/components/ui/Loader";

describe("Loader", () => {
  it("renders the loader with Processing text", () => {
    const { container } = render(<Loader />);
    expect(container.textContent).toContain("Processing...");
  });
});
