import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TypologyPage, { normalizeTypologyConfig } from "@/features/config/pages/TypologyPage";

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();

jest.mock("@/features/config/services/configApi", () => ({
  configApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));
jest.mock("@/shared/providers/ToastProvider", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
}));
jest.mock("@/features/auth/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: "1", username: "test", tenantId: "default" },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));
jest.mock("@/common/Tables/CustomTable", () => {
  return React.forwardRef((props: any, _ref: any) => {
    const actionsCol = props.columns?.find((c: any) => c.field === "actions");
    return (
      <div data-testid="custom-table">
        {props.rows?.map((row: any, idx: number) => (
          <div key={idx} data-testid={`row-${idx}`}>
            {props.columns?.map((col: any) =>
              col.renderCell
                ? col.renderCell({ row, value: row[col.field], field: col.field })
                : null,
            )}
            {actionsCol?.renderCell?.({ row, value: row[actionsCol.field] })}
          </div>
        ))}
      </div>
    );
  });
});
jest.mock("@/features/config/components/TypologyConfigEditor", () => {
  return React.forwardRef((props: any, _ref: any) => {
    return (
      <div data-testid="typo-editor">
        <button data-testid="inject-invalid" onClick={() => props.onChange("invalid-json")}>
          inject-invalid
        </button>
        <button
          data-testid="inject-valid"
          onClick={() =>
            props.onChange(JSON.stringify({ rules: [], expression: [], workflow: {} }))
          }
        >
          inject-valid
        </button>
      </div>
    );
  });
});
jest.mock("@/features/config/components/JsonPreviewPanel", () => ({
  __esModule: true,
  default: ({ json }: { json: string }) => <div data-testid="json-preview">{json}</div>,
}));

import { configApi } from "@/features/config/services/configApi";
const mockList = configApi.list as jest.MockedFunction<typeof configApi.list>;
const mockCreate = configApi.create as jest.MockedFunction<typeof configApi.create>;

const renderPage = () =>
  render(
    <MemoryRouter>
      <TypologyPage />
    </MemoryRouter>,
  );

describe("TypologyPage validation paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ data: [], meta: { total: 0, limit: 20, offset: 0 } });
    mockCreate.mockResolvedValue({});
  });

  it("shows error when config is invalid JSON", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Create New"));
    await waitFor(() => expect(screen.getByText("Create")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "901" } });
    fireEvent.change(screen.getByLabelText("Config Version"), { target: { value: "1.0.0" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Test" } });
    fireEvent.click(screen.getByTestId("inject-invalid"));
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith("Validation error", "Config must be valid JSON"),
    );
  });
});

describe("normalizeTypologyConfig", () => {
  it("falls back to empty collections when the config omits them", () => {
    expect(normalizeTypologyConfig({})).toEqual({
      rules: [],
      expression: [],
      workflow: {},
    });
  });

  it("keeps the provided collections", () => {
    const rules = [{ id: "r1" }];
    const expression = ["Add"];
    const workflow = { alertThreshold: 1 };
    expect(normalizeTypologyConfig({ rules, expression, workflow })).toEqual({
      rules,
      expression,
      workflow,
    });
  });
});
