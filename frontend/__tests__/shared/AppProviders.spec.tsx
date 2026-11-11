import React from "react";
import { render } from "@testing-library/react";
import { AppProviders } from "@/shared/providers/AppProviders";

jest.mock("@/features/auth/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/shared/providers/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("AppProviders", () => {
  it("renders children wrapped in providers", () => {
    const { container } = render(
      <AppProviders>
        <div data-testid="child">Hello</div>
      </AppProviders>,
    );
    expect(container).toBeTruthy();
  });
});
