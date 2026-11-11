import React from "react";
import { render } from "@testing-library/react";
import App from "@/App";

jest.mock("@/shared/providers/AppProviders", () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/router", () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes</div>,
}));

describe("App", () => {
  it("renders AppRoutes", () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId("app-routes")).toBeInTheDocument();
  });
});
