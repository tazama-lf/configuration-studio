import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NetworkMapPage from "@/features/config/pages/NetworkMapPage";

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();

jest.mock("@/features/config/services/configApi", () => ({
  configApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    activateNetworkMap: jest.fn(),
    deactivateNetworkMap: jest.fn(),
    reloadNetworkMap: jest.fn(),
  },
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
// Mock NetworkMapConfigEditor to allow injecting invalid JSON
jest.mock("@/features/config/components/NetworkMapConfigEditor", () => {
  return React.forwardRef((props: any, _ref: any) => {
    return (
      <div data-testid="nm-editor">
        <button data-testid="inject-invalid-json" onClick={() => props.onChange("invalid-json")}>
          inject-invalid
        </button>
        <button data-testid="inject-non-array" onClick={() => props.onChange('{"not": "array"}')}>
          inject-non-array
        </button>
        <button data-testid="inject-valid" onClick={() => props.onChange("[]")}>
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

const testData = [{ cfg: "1.0.0", active: true, messages: "[]", tenantId: "default" }];

const renderPage = () =>
  render(
    <MemoryRouter>
      <NetworkMapPage />
    </MemoryRouter>,
  );

describe("NetworkMapPage validation paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ data: testData, meta: { total: 1, limit: 20, offset: 0 } });
    mockCreate.mockResolvedValue({});
  });

  it("shows error when messages is invalid JSON", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Create New"));
    await waitFor(() => expect(screen.getByText("Create")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Config Version"), { target: { value: "1.0.0" } });
    fireEvent.click(screen.getByTestId("inject-invalid-json"));
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith("Validation error", "Messages must be valid JSON"),
    );
  });

  it("shows error when messages is not an array", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Create New"));
    await waitFor(() => expect(screen.getByText("Create")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Config Version"), { target: { value: "1.0.0" } });
    fireEvent.click(screen.getByTestId("inject-non-array"));
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        "Validation error",
        "Messages must be a JSON array (e.g. [] or [{ id: 'x', cfg: '1.0.0', ... }])",
      ),
    );
  });
});
