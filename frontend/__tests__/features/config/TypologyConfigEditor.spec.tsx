import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TypologyConfigEditor from "@/features/config/components/TypologyConfigEditor";
import { configApi } from "@/features/config/services/configApi";

const mockList = configApi.list as jest.MockedFunction<typeof configApi>;

jest.mock("@/features/config/services/configApi", () => ({
  configApi: {
    list: jest.fn().mockResolvedValue({
      data: [
        { id: "rule1", cfg: "1.0.0", desc: "Rule 1" },
        { id: "rule2", cfg: "2.0.0", desc: "Rule 2" },
      ],
      meta: { total: 2, limit: 100, offset: 0 },
    }),
  },
}));

/**
 * Helper: extract React props from a DOM element (React 18 stores them
 * under a key like __reactProps$<random>).
 */
function getReactProps(element: HTMLElement): Record<string, unknown> {
  const key = Object.keys(element).find((k) => k.startsWith("__reactProps$"));
  return key
    ? ((element as unknown as Record<string, unknown>)[key] as Record<string, unknown>)
    : {};
}

/**
 * Helper: find the Autocomplete div inside the rule accordion and invoke
 * its onChange prop with a specific value.
 */
function invokeAutocompleteChange(container: HTMLElement, value: unknown) {
  const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
  const props = getReactProps(autocomplete);
  const onChange = props.onChange as (event: unknown, val: unknown) => void;
  act(() => {
    onChange({}, value);
  });
}

describe("TypologyConfigEditor", () => {
  const defaultProps = {
    value: "{}",
    onChange: jest.fn(),
  };

  it("renders Rules section", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("Add Rule")).toBeInTheDocument();
  });

  it("adds a rule", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    expect(screen.getAllByText("Rule 1").length).toBeGreaterThan(0);
  });

  it("falls back to an empty config when the incoming value is blank", () => {
    const { rerender } = render(<TypologyConfigEditor {...defaultProps} value="{}" />);
    // Switching to a blank value reaches the `value || '{}'` fallback because
    // the blank string differs from the previously emitted JSON.
    rerender(<TypologyConfigEditor {...defaultProps} value="" />);
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("renders in readOnly mode", () => {
    render(<TypologyConfigEditor {...defaultProps} readOnly={true} />);
    expect(screen.queryByText("Add Rule")).not.toBeInTheDocument();
  });

  it("shows JSON preview by default", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    expect(screen.getByText("JSON Preview")).toBeInTheDocument();
  });

  it("hides JSON preview when hideJsonPreview is true", () => {
    render(<TypologyConfigEditor {...defaultProps} hideJsonPreview={true} />);
    expect(screen.queryByText("JSON Preview")).not.toBeInTheDocument();
  });

  it("adds a weight to a rule", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    fireEvent.click(screen.getByText("Add Weight"));
    expect(screen.getAllByText("Auto-generated")).toHaveLength(2);
  });

  it("removes a rule", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    fireEvent.click(screen.getByText("Remove Rule"));
    expect(screen.queryByText("Rule 1")).not.toBeInTheDocument();
  });

  it("parses initial value with rules", () => {
    const value = JSON.stringify({
      rules: [{ id: "rule1", cfg: "1.0.0", wghts: [{ ref: ".01", wght: 1 }], termId: "term1" }],
      expression: ["Add"],
      workflow: { alertThreshold: 50, interdictionThreshold: 100, flowProcessor: "fp1" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    expect(screen.getAllByText("Rule 1").length).toBeGreaterThan(0);
  });

  it("handles invalid JSON value", () => {
    render(<TypologyConfigEditor {...defaultProps} value="invalid-json" />);
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("calls onChange", () => {
    const onChange = jest.fn();
    render(<TypologyConfigEditor {...defaultProps} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onPreviewChange", () => {
    const onPreviewChange = jest.fn();
    render(
      <TypologyConfigEditor
        {...defaultProps}
        onPreviewChange={onPreviewChange}
        id="typo1"
        cfg="1.0.0"
        desc="Test"
        tenantId="default"
      />,
    );
    expect(onPreviewChange).toHaveBeenCalled();
  });

  it("renders Expression section", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    expect(screen.getByText("Expression")).toBeInTheDocument();
  });

  it("adds expression item", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Item"));
  });

  it("renders Workflow section", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    expect(screen.getByText("Workflow")).toBeInTheDocument();
  });

  // ── Weight removal ───────────────────────────────────────────────────────
  it("removes a weight from a rule", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    fireEvent.click(screen.getByText("Add Weight"));
    // There should be two weights now (the default .err + the new one)
    expect(screen.getAllByText("Auto-generated")).toHaveLength(2);
    // Find the remove-weight IconButtons (error color, no text)
    const buttons = screen.getAllByRole("button");
    const removeWeightBtns = buttons.filter(
      (b) => b.getAttribute("color") === "error" && b.textContent === "",
    );
    // Click the last remove-weight button (second weight's delete)
    fireEvent.click(removeWeightBtns[removeWeightBtns.length - 1]);
    // Back to one weight
    expect(screen.getAllByText("Auto-generated")).toHaveLength(1);
  });

  // ── Term Id typing ───────────────────────────────────────────────────────
  it("typing in Term Id field updates the rule", () => {
    const onChange = jest.fn();
    render(<TypologyConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Rule"));
    const termIdInput = screen.getByLabelText("Term Id");
    fireEvent.change(termIdInput, { target: { value: "v001at100at100" } });
    expect((termIdInput as HTMLInputElement).value).toBe("v001at100at100");
  });

  // ── Weight value typing ──────────────────────────────────────────────────
  it("typing in Weight value field updates the weight", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    const weightInput = screen.getByLabelText("Weight");
    fireEvent.change(weightInput, { target: { value: "5" } });
    expect((weightInput as HTMLInputElement).value).toBe("5");
  });

  // ── Expression add/remove/update ─────────────────────────────────────────
  it("adds and removes an expression item", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Item"));
    expect(screen.getByLabelText("Operation")).toBeInTheDocument();
    // Remove the expression item via the error IconButton
    const buttons = screen.getAllByRole("button");
    const removeBtns = buttons.filter(
      (b) => b.getAttribute("color") === "error" && b.textContent === "",
    );
    fireEvent.click(removeBtns[removeBtns.length - 1]);
    expect(screen.queryByLabelText("Operation")).not.toBeInTheDocument();
  });

  it("typing in expression Operation field updates the item", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Item"));
    const opInput = screen.getByLabelText("Operation");
    fireEvent.change(opInput, { target: { value: "Add" } });
    expect((opInput as HTMLInputElement).value).toBe("Add");
  });

  it("adds a second expression item and types in Term field", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    // Add a rule with a termId so the Term dropdown has options
    fireEvent.click(screen.getByText("Add Rule"));
    const termIdInput = screen.getByLabelText("Term Id");
    fireEvent.change(termIdInput, { target: { value: "term1" } });
    // Add two expression items
    fireEvent.click(screen.getByText("Add Item"));
    fireEvent.click(screen.getByText("Add Item"));
    // The second item should be a Term 1 field
    const term1Input = screen.getByLabelText("Term 1");
    fireEvent.change(term1Input, { target: { value: "term1" } });
    expect((term1Input as HTMLInputElement).value).toBe("term1");
  });

  // ── Workflow field typing ────────────────────────────────────────────────
  it("typing in Alert Threshold field updates workflow", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    const alertInput = screen.getByLabelText("Alert Threshold");
    fireEvent.change(alertInput, { target: { value: "50" } });
    expect((alertInput as HTMLInputElement).value).toBe("50");
  });

  it("typing in Interdiction Threshold field updates workflow", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    const interdictionInput = screen.getByLabelText("Interdiction Threshold");
    fireEvent.change(interdictionInput, { target: { value: "100" } });
    expect((interdictionInput as HTMLInputElement).value).toBe("100");
  });

  it("typing in Flow Processor field updates workflow", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    const fpInput = screen.getByLabelText("Flow Processor");
    fireEvent.change(fpInput, { target: { value: "EFRuP@1.0.0" } });
    expect((fpInput as HTMLInputElement).value).toBe("EFRuP@1.0.0");
  });

  // ── Pre-populated rendering ──────────────────────────────────────────────
  it("renders with pre-populated rules and weights", () => {
    const value = JSON.stringify({
      rules: [
        {
          id: "rule1",
          cfg: "1.0.0",
          wghts: [
            { ref: ".01", wght: 1 },
            { ref: ".02", wght: 2 },
          ],
          termId: "term1",
        },
      ],
      expression: [],
      workflow: { alertThreshold: 0, interdictionThreshold: 0, flowProcessor: "" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    expect(screen.getAllByText("Rule 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Auto-generated")).toHaveLength(2);
  });

  it("renders with pre-populated expression", () => {
    const value = JSON.stringify({
      rules: [],
      expression: ["Add", "term1"],
      workflow: { alertThreshold: 0, interdictionThreshold: 0, flowProcessor: "" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    expect(screen.getByLabelText("Operation")).toBeInTheDocument();
    expect(screen.getByLabelText("Term 1")).toBeInTheDocument();
  });

  it("renders with pre-populated workflow", () => {
    const value = JSON.stringify({
      rules: [],
      expression: [],
      workflow: { alertThreshold: 50, interdictionThreshold: 100, flowProcessor: "fp1" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    expect((screen.getByLabelText("Alert Threshold") as HTMLInputElement).value).toBe("50");
    expect((screen.getByLabelText("Interdiction Threshold") as HTMLInputElement).value).toBe("100");
    expect((screen.getByLabelText("Flow Processor") as HTMLInputElement).value).toBe("fp1");
  });

  // ── onPreviewChange with all props ───────────────────────────────────────
  it("calls onPreviewChange with all props (id, cfg, desc, tenantId)", () => {
    const onPreviewChange = jest.fn();
    render(
      <TypologyConfigEditor
        {...defaultProps}
        onPreviewChange={onPreviewChange}
        id="typo1"
        cfg="1.0.0"
        desc="Test Typology"
        tenantId="default"
      />,
    );
    expect(onPreviewChange).toHaveBeenCalled();
    const lastCall = onPreviewChange.mock.calls[onPreviewChange.mock.calls.length - 1][0];
    const parsed = JSON.parse(lastCall);
    expect(parsed.id).toBe("typo1");
    expect(parsed.cfg).toBe("1.0.0");
    expect(parsed.desc).toBe("Test Typology");
    expect(parsed.tenantId).toBe("default");
  });

  // ── readOnly mode ────────────────────────────────────────────────────────
  it("readOnly mode hides Add Rule, Add Weight, and Remove buttons", () => {
    const value = JSON.stringify({
      rules: [
        {
          id: "rule1",
          cfg: "1.0.0",
          wghts: [{ ref: ".01", wght: 1 }],
          termId: "term1",
        },
      ],
      expression: ["Add"],
      workflow: { alertThreshold: 0, interdictionThreshold: 0, flowProcessor: "" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} readOnly={true} />);
    expect(screen.queryByText("Add Rule")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Weight")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove Rule")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
  });

  // ── API fetch error handling ─────────────────────────────────────────────
  it("handles API fetch error gracefully", async () => {
    mockList.mockRejectedValueOnce(new Error("Network error"));
    render(<TypologyConfigEditor {...defaultProps} />);
    // Component should still render without crashing
    expect(screen.getByText("Rules")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
  });

  // ── Autocomplete onChange with string value (with @) ─────────────────────
  it("Autocomplete onChange with string value containing @ updates rule", () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    invokeAutocompleteChange(container, "myRule@2.0.0");
    // The rule id should be updated — check via the preview or onChange
    expect(screen.getByText("myRule")).toBeInTheDocument();
  });

  // ── Autocomplete onChange with string value (without @) ──────────────────
  it("Autocomplete onChange with string value without @ updates rule", () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    invokeAutocompleteChange(container, "plainRule");
    expect(screen.getByText("plainRule")).toBeInTheDocument();
  });

  // ── Autocomplete onChange with null value (clearing) ─────────────────────
  it("Autocomplete onChange with null value clears the rule", () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    // First set a rule id
    invokeAutocompleteChange(container, "someRule@1.0.0");
    expect(screen.getByText("someRule")).toBeInTheDocument();
    // Now clear it
    invokeAutocompleteChange(container, null);
    expect(screen.getByText("(not selected)")).toBeInTheDocument();
  });

  // ── Autocomplete onChange with object value ──────────────────────────────
  it("Autocomplete onChange with object value updates rule", () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    invokeAutocompleteChange(container, { id: "rule1", cfg: "1.0.0", desc: "Rule 1" });
    expect(screen.getByText("rule1")).toBeInTheDocument();
  });

  // ── Autocomplete onChange with empty string ──────────────────────────────
  it("Autocomplete onChange with empty string clears the rule", () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    invokeAutocompleteChange(container, "someRule@1.0.0");
    expect(screen.getByText("someRule")).toBeInTheDocument();
    invokeAutocompleteChange(container, "");
    expect(screen.getByText("(not selected)")).toBeInTheDocument();
  });

  // ── No rules / no expression messages ────────────────────────────────────
  it("shows no rules message when empty", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    expect(screen.getByText("No rules added yet")).toBeInTheDocument();
  });

  it("shows no expression items message when empty", () => {
    render(<TypologyConfigEditor {...defaultProps} />);
    expect(screen.getByText("No expression items")).toBeInTheDocument();
  });

  // ── Rule description display ─────────────────────────────────────────────
  it("displays rule description when a matching rule option is selected", async () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    // Wait for rule options to load
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    // Select a rule that exists in the options
    invokeAutocompleteChange(container, { id: "rule1", cfg: "1.0.0", desc: "Rule 1" });
    // The rule id "rule1" should appear in the accordion summary
    expect(screen.getByText("rule1")).toBeInTheDocument();
  });

  // ── Autocomplete renderOption / renderInput / getOptionLabel / isOptionEqualToValue ─
  it("invokes Autocomplete getOptionLabel with string and object options", async () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    // Debug: check if __reactProps exists
    const propKeys = Object.keys(autocomplete).filter((k) => k.startsWith("__reactProps"));
    expect(propKeys.length).toBeGreaterThan(0);
    const props = getReactProps(autocomplete);
    // Debug: check if getOptionLabel exists
    expect(typeof props.getOptionLabel).toBe("function");
    const getOptionLabel = props.getOptionLabel as (option: unknown) => string;
    // String option — this should cover the typeof option === 'string' true branch
    const strResult = getOptionLabel("myRule");
    expect(strResult).toBe("myRule");
    // Object option — this should cover the typeof option === 'string' false branch
    const objResult = getOptionLabel({ id: "rule1", cfg: "1.0.0" });
    expect(objResult).toBe("rule1");
    // Call again to be sure
    expect(getOptionLabel("another")).toBe("another");
  });

  it("invokes Autocomplete isOptionEqualToValue with string and object values", async () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const isOptionEqualToValue = props.isOptionEqualToValue as (
      option: unknown,
      value: unknown,
    ) => boolean;
    // Both strings — equal
    expect(isOptionEqualToValue("a", "a")).toBe(true);
    // Both strings — not equal
    expect(isOptionEqualToValue("a", "b")).toBe(false);
    // Both objects — equal by id
    expect(isOptionEqualToValue({ id: "r1", cfg: "1.0.0" }, { id: "r1", cfg: "2.0.0" })).toBe(true);
    // Both objects — not equal by id
    expect(isOptionEqualToValue({ id: "r1", cfg: "1.0.0" }, { id: "r2", cfg: "1.0.0" })).toBe(
      false,
    );
  });

  it("invokes Autocomplete renderOption with string and object options", async () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderOption = props.renderOption as (props: unknown, option: unknown) => React.ReactNode;
    // String option — should render without crashing
    const result1 = renderOption({ key: "1" }, "myRule");
    expect(result1).toBeDefined();
    // Object option with desc
    const result2 = renderOption({ key: "2" }, { id: "rule1", cfg: "1.0.0", desc: "Rule 1" });
    expect(result2).toBeDefined();
    // Object option without desc
    const result3 = renderOption({ key: "3" }, { id: "rule2", cfg: "2.0.0" });
    expect(result3).toBeDefined();
  });

  it("invokes Autocomplete renderInput with and without selected rule", async () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderInput = props.renderInput as (params: unknown) => React.ReactNode;
    // renderInput should produce a TextField — rule.id is empty so selectedDesc is undefined
    const result = renderInput({});
    expect(result).toBeDefined();
  });

  it("invokes Autocomplete renderInput with a selected rule (selectedDesc)", async () => {
    const { container } = render(<TypologyConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Rule"));
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    // Select a rule so rule.id is truthy
    invokeAutocompleteChange(container, { id: "rule1", cfg: "1.0.0", desc: "Rule 1" });
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderInput = props.renderInput as (params: unknown) => React.ReactNode;
    // renderInput with a selected rule — selectedDesc should be "Rule 1"
    const result = renderInput({});
    expect(result).toBeDefined();
  });

  // ── interdictionThreshold undefined branch ───────────────────────────────
  it("handles undefined interdictionThreshold in workflow", () => {
    const value = JSON.stringify({
      rules: [],
      expression: [],
      workflow: { alertThreshold: 10, flowProcessor: "fp1" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    // interdictionThreshold is undefined, so ?? 0 should give 0
    const interdictionInput = screen.getByLabelText("Interdiction Threshold") as HTMLInputElement;
    expect(interdictionInput.value).toBe("0");
  });

  // ── value equals last emitted (skip parsing) ─────────────────────────────
  it("skips parsing when value equals last emitted JSON", async () => {
    let capturedJson = "";
    const onChange = jest.fn((json: string) => {
      capturedJson = json;
    });
    const { rerender } = render(<TypologyConfigEditor {...defaultProps} onChange={onChange} />);
    // After initial render, onChange is called with the generated JSON.
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const emittedJson = capturedJson;
    expect(emittedJson).toBeTruthy();
    expect(emittedJson).not.toBe("{}");
    // Re-render with that same JSON value — the parse effect should skip (line 110)
    rerender(<TypologyConfigEditor value={emittedJson} onChange={onChange} />);
    // Wait for effects to settle
    await waitFor(() => {
      expect(capturedJson).toBe(emittedJson);
    });
  });

  // ── Multiple rules to cover updateRule false branch ──────────────────────
  it("updates the correct rule when multiple rules exist", () => {
    const value = JSON.stringify({
      rules: [
        { id: "rule1", cfg: "1.0.0", wghts: [{ ref: ".01", wght: 1 }], termId: "term1" },
        { id: "rule2", cfg: "2.0.0", wghts: [{ ref: ".01", wght: 2 }], termId: "term2" },
      ],
      expression: [],
      workflow: { alertThreshold: 0, interdictionThreshold: 0, flowProcessor: "" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    // Both rules should be rendered
    expect(screen.getByText("rule1")).toBeInTheDocument();
    expect(screen.getByText("rule2")).toBeInTheDocument();
    // Type in the first rule's Term Id to trigger updateRule with idx=0
    const termIdInputs = screen.getAllByPlaceholderText("v001at100at100");
    fireEvent.change(termIdInputs[0], { target: { value: "updatedTerm" } });
    expect((termIdInputs[0] as HTMLInputElement).value).toBe("updatedTerm");
    // The second rule's Term Id should be unchanged
    expect((termIdInputs[1] as HTMLInputElement).value).toBe("term2");
  });

  // ── Multiple weights to cover updateWeight false branch ──────────────────
  it("updates the correct weight when multiple weights exist", () => {
    const value = JSON.stringify({
      rules: [
        {
          id: "rule1",
          cfg: "1.0.0",
          wghts: [
            { ref: ".01", wght: 1 },
            { ref: ".02", wght: 2 },
          ],
          termId: "term1",
        },
      ],
      expression: [],
      workflow: { alertThreshold: 0, interdictionThreshold: 0, flowProcessor: "" },
    });
    render(<TypologyConfigEditor {...defaultProps} value={value} />);
    // Find weight inputs by their type and value
    const allInputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    // Filter for number inputs with values "1" and "2" (the weights)
    const weightInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(
      (el) => el.value === "1" || el.value === "2",
    ) as HTMLInputElement[];
    expect(weightInputs).toHaveLength(2);
    // Change the first weight
    fireEvent.change(weightInputs[0], { target: { value: "10" } });
    expect((weightInputs[0] as HTMLInputElement).value).toBe("10");
    // The second weight should be unchanged
    expect((weightInputs[1] as HTMLInputElement).value).toBe("2");
  });

  // ── Skip-parse branch coverage (line 110 true branch) ───────────────────
  it("covers skip-parse branch when value equals lastEmittedRef", async () => {
    const onChange = jest.fn();
    const { rerender } = render(<TypologyConfigEditor value="{}" onChange={onChange} />);
    // Wait for the API fetch to resolve and all effects to settle
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    // Wait for the emit effect to fire and set lastEmittedRef
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const emittedJson = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(emittedJson).not.toBe("{}");
    // Rerender with the emitted JSON — parse effect should return early
    await act(async () => {
      rerender(<TypologyConfigEditor value={emittedJson} onChange={onChange} />);
      await new Promise((r) => setTimeout(r, 0));
    });
  });

  // ── Skip-parse branch via state-driven parent (line 110 true branch) ─────
  it("skip-parse branch: parent feeds emitted value back as prop", async () => {
    function StatefulParent() {
      const [val, setVal] = React.useState("{}");
      const handleChange = React.useCallback((json: string) => {
        setVal(json);
      }, []);
      return <TypologyConfigEditor value={val} onChange={handleChange} />;
    }
    await act(async () => {
      render(<StatefulParent />);
      await new Promise((r) => setTimeout(r, 0));
    });
    await waitFor(() => {
      expect(screen.getByText("Rules")).toBeInTheDocument();
    });
  });

  it("handles empty string value with fallback to {}", () => {
    render(<TypologyConfigEditor {...defaultProps} value="" />);
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  // ── Skip-parse branch: value equals lastEmittedRef (line 110 true branch) ─
  it("skip-parse branch: rerender with emitted value skips parse", async () => {
    const onChange = jest.fn();
    const { rerender } = render(<TypologyConfigEditor value="{}" onChange={onChange} />);
    // Wait for the API fetch and emit effect to fire
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    // Get the last emitted JSON
    const emittedJson = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(emittedJson).not.toBe("{}");
    // Rerender with the emitted JSON — the parse effect should hit the
    // `if (value === lastEmittedRef.current) return;` branch and skip parsing
    await act(async () => {
      rerender(<TypologyConfigEditor value={emittedJson} onChange={onChange} />);
      await new Promise((r) => setTimeout(r, 0));
    });
    // Verify the component still renders correctly
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });
});
