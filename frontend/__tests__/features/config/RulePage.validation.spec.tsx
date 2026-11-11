import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RulePage, { validateRuleConfig } from "@/features/config/pages/RulePage";

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
// Mock RuleConfigEditor to allow injecting invalid JSON
jest.mock("@/features/config/components/RuleConfigEditor", () => {
  return React.forwardRef((props: any, _ref: any) => {
    return (
      <div data-testid="rule-editor">
        <button data-testid="inject-invalid" onClick={() => props.onChange("invalid-json")}>
          inject-invalid
        </button>
        <button
          data-testid="inject-empty-bands"
          onClick={() => props.onChange(JSON.stringify({ config: { bands: [] } }))}
        >
          inject-empty-bands
        </button>
        <button
          data-testid="inject-empty-cases"
          onClick={() => props.onChange(JSON.stringify({ config: { cases: { expressions: [] } } }))}
        >
          inject-empty-cases
        </button>
        <button
          data-testid="inject-valid-bands"
          onClick={() =>
            props.onChange(
              JSON.stringify({ config: { bands: [{ subRuleRef: ".01", reason: "test" }] } }),
            )
          }
        >
          inject-valid-bands
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
      <RulePage />
    </MemoryRouter>,
  );

describe("RulePage validation paths", () => {
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

  it("shows error when bands is empty array", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Create New"));
    await waitFor(() => expect(screen.getByText("Create")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "901" } });
    fireEvent.change(screen.getByLabelText("Config Version"), { target: { value: "1.0.0" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Test" } });
    fireEvent.click(screen.getByTestId("inject-empty-bands"));
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        "Validation error",
        "At least one band is required when using Bands config type",
      ),
    );
  });

  it("shows error when cases has no expressions and no alternative", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Create New"));
    await waitFor(() => expect(screen.getByText("Create")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "901" } });
    fireEvent.change(screen.getByLabelText("Config Version"), { target: { value: "1.0.0" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Test" } });
    fireEvent.click(screen.getByTestId("inject-empty-cases"));
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
  });
});

describe("validateRuleConfig", () => {
  it("returns null when the payload has no config", () => {
    expect(validateRuleConfig(undefined)).toBeNull();
  });

  it("returns null for a config with bands", () => {
    expect(validateRuleConfig({ bands: [{ subRuleRef: ".01" }] })).toBeNull();
  });

  it("returns an error for an empty bands array", () => {
    expect(validateRuleConfig({ bands: [] })).toBe(
      "At least one band is required when using Bands config type",
    );
  });

  it("returns null for a cases config with expressions", () => {
    expect(validateRuleConfig({ cases: { expressions: [{}] } })).toBeNull();
  });

  it("returns null for a cases config with an alternative", () => {
    expect(validateRuleConfig({ cases: { expressions: [], alternative: {} } })).toBeNull();
  });

  it("treats a non-array expressions value as empty", () => {
    expect(validateRuleConfig({ cases: { expressions: "nope" } })).toBe(
      "At least one case expression or alternative is required when using Cases config type",
    );
  });

  it("returns an error when cases has neither expressions nor alternative", () => {
    expect(validateRuleConfig({ cases: {} })).toBe(
      "At least one case expression or alternative is required when using Cases config type",
    );
  });
});
