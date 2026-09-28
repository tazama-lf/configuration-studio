import React from "react";

const mockCreateRoot = jest.fn(() => ({
  render: jest.fn(),
}));

jest.mock("react-dom/client", () => ({
  createRoot: mockCreateRoot,
}));

jest.mock("@/App.tsx", () => {
  const MockApp = () => React.createElement("div", null, "MockApp");
  MockApp.displayName = "MockApp";
  return { default: MockApp };
});

describe("main.tsx", () => {
  it("calls createRoot and renders the app", () => {
    // Importing main.tsx triggers createRoot(...).render(...)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("../src/main");
    expect(mockCreateRoot).toHaveBeenCalled();
    const renderCall = mockCreateRoot.mock.results[0].value;
    expect(renderCall.render).toHaveBeenCalled();
  });
});
