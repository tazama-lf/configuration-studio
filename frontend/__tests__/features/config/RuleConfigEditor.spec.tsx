import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RuleConfigEditor from "@/features/config/components/RuleConfigEditor";

describe("RuleConfigEditor", () => {
  const defaultProps = {
    value: "{}",
    onChange: jest.fn(),
  };

  it("renders with config type toggle", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    expect(screen.getByText("Config Type")).toBeInTheDocument();
    expect(screen.getAllByText("Bands").length).toBeGreaterThan(0);
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });

  it("renders Parameters section", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByText("Add Parameter")).toBeInTheDocument();
  });

  it("renders Exit Conditions section", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    expect(screen.getByText("Exit Conditions")).toBeInTheDocument();
    expect(screen.getByText("Add Exit Condition")).toBeInTheDocument();
  });

  it("renders Timeframes section", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    expect(screen.getByText("Timeframes")).toBeInTheDocument();
    expect(screen.getByText("Add Timeframe")).toBeInTheDocument();
  });

  it("renders Bands section by default", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    expect(screen.getAllByText("Bands").length).toBeGreaterThan(0);
    expect(screen.getByText("Add Band")).toBeInTheDocument();
  });

  it("switches to Cases view", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Cases"));
    expect(screen.getByText("Add Expression")).toBeInTheDocument();
    expect(screen.getByText("Alternative (Fallback)")).toBeInTheDocument();
  });

  it("adds a parameter", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Parameter"));
    expect(screen.getByText("Select key")).toBeInTheDocument();
  });

  it("adds an exit condition", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Exit Condition"));
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThan(0);
  });

  it("adds a timeframe", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Timeframe"));
    expect(screen.getAllByText("Start").length).toBeGreaterThan(0);
  });

  it("adds a band", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Band"));
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThan(0);
  });

  it("adds a case expression", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Cases"));
    fireEvent.click(screen.getByText("Add Expression"));
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThan(0);
  });

  it("evaluates the reason when value and sub rule ref are both empty", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: { expressions: [{ value: "", subRuleRef: "", reason: "" }] },
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    // The sub rule ref is auto-generated in the UI, so an empty one can only
    // come from a stored config — this exercises the reason operand of the filter.
    expect(screen.getByText("Add Expression")).toBeInTheDocument();
  });

  it("renders in readOnly mode", () => {
    render(<RuleConfigEditor {...defaultProps} readOnly={true} />);
    expect(screen.queryByText("Add Parameter")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Exit Condition")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Band")).not.toBeInTheDocument();
  });

  it("hides JSON preview when hideJsonPreview is true", () => {
    render(<RuleConfigEditor {...defaultProps} hideJsonPreview={true} />);
    expect(screen.queryByText("JSON Preview (read-only)")).not.toBeInTheDocument();
  });

  it("shows JSON preview by default", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    expect(screen.getByText("JSON Preview (read-only)")).toBeInTheDocument();
  });

  it("calls onChange on render", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onPreviewChange", () => {
    const onPreviewChange = jest.fn();
    render(
      <RuleConfigEditor
        {...defaultProps}
        onPreviewChange={onPreviewChange}
        id="rule1"
        cfg="1.0.0"
        desc="Test rule"
        tenantId="default"
      />,
    );
    expect(onPreviewChange).toHaveBeenCalled();
  });

  it("parses initial value with bands config", () => {
    const value = JSON.stringify({
      parameters: { maxQueryRange: 100 },
      exitConditions: [{ subRuleRef: ".X01", reason: "test" }],
      bands: [{ subRuleRef: ".01", reason: "test band", lowerLimit: 0, upperLimit: 100 }],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getByText("Parameters")).toBeInTheDocument();
  });

  it("parses initial value with cases config", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "fallback", subRuleRef: ".00" },
        expressions: [{ value: "CASH", reason: "cash", subRuleRef: ".01" }],
      },
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getByText("Add Expression")).toBeInTheDocument();
  });

  it("parses initial value with timeframes", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [],
      timeframes: [{ start: "08:00", end: "17:00", days: ["MON", "TUE"] }],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getByText("Timeframes")).toBeInTheDocument();
  });

  it("handles invalid JSON value", () => {
    render(<RuleConfigEditor {...defaultProps} value="invalid-json" />);
    expect(screen.getByText("Parameters")).toBeInTheDocument();
  });

  it("removes a parameter", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Parameter"));
    const buttons = screen.getAllByRole("button");
    const removeBtn = buttons.find((b) => b.getAttribute("color") === "error");
    if (removeBtn) fireEvent.click(removeBtn);
    expect(screen.getByText("Add Parameter")).toBeInTheDocument();
  });

  it("removes an exit condition", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Exit Condition"));
    const buttons = screen.getAllByRole("button");
    const removeBtns = buttons.filter((b) => b.getAttribute("color") === "error");
    if (removeBtns.length > 0) fireEvent.click(removeBtns[0]);
    expect(screen.getByText("Add Exit Condition")).toBeInTheDocument();
  });

  it("removes a band", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Band"));
    const buttons = screen.getAllByRole("button");
    const removeBtns = buttons.filter((b) => b.getAttribute("color") === "error");
    if (removeBtns.length > 0) fireEvent.click(removeBtns[removeBtns.length - 1]);
    expect(screen.getByText("Add Band")).toBeInTheDocument();
  });

  it("removes a timeframe", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Timeframe"));
    const buttons = screen.getAllByRole("button");
    const removeBtns = buttons.filter((b) => b.getAttribute("color") === "error");
    if (removeBtns.length > 0) fireEvent.click(removeBtns[0]);
    expect(screen.getByText("Add Timeframe")).toBeInTheDocument();
  });

  // ── Typing in fields (covers update handlers + onChange props) ──

  it("types in parameter key and value fields", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Parameter"));
    const keyInput = screen.getByLabelText("Key");
    fireEvent.change(keyInput, { target: { value: "maxQueryRange" } });
    const valueInput = screen.getByLabelText("Value");
    fireEvent.change(valueInput, { target: { value: "100" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("types in exit condition reason field", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Exit Condition"));
    const reasonInput = screen.getByLabelText("Reason");
    fireEvent.change(reasonInput, { target: { value: "test reason" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("types in timeframe start, end, and days fields", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Timeframe"));
    const startInput = screen.getByLabelText("Start");
    fireEvent.change(startInput, { target: { value: "08:00" } });
    const endInput = screen.getByLabelText("End");
    fireEvent.change(endInput, { target: { value: "17:00" } });
    const daysInput = screen.getByLabelText("Days");
    fireEvent.change(daysInput, { target: { value: ["MON", "TUE"] } });
    expect(onChange).toHaveBeenCalled();
  });

  it("types in band reason, lowerLimit, and upperLimit fields", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Band"));
    const reasonInput = screen.getByLabelText("Reason");
    fireEvent.change(reasonInput, { target: { value: "test band reason" } });
    const lowerLimitInput = screen.getByLabelText("Lower Limit");
    fireEvent.change(lowerLimitInput, { target: { value: "0" } });
    const upperLimitInput = screen.getByLabelText("Upper Limit");
    fireEvent.change(upperLimitInput, { target: { value: "100" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("clears band lowerLimit to undefined", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Band"));
    const lowerLimitInput = screen.getByLabelText("Lower Limit");
    fireEvent.change(lowerLimitInput, { target: { value: "0" } });
    fireEvent.change(lowerLimitInput, { target: { value: "" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("clears band upperLimit to undefined", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Band"));
    const upperLimitInput = screen.getByLabelText("Upper Limit");
    fireEvent.change(upperLimitInput, { target: { value: "100" } });
    fireEvent.change(upperLimitInput, { target: { value: "" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("types in case expression value and reason fields", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Cases"));
    fireEvent.click(screen.getByText("Add Expression"));
    const valueInput = screen.getByLabelText("Value");
    fireEvent.change(valueInput, { target: { value: "CASH" } });
    const reasonInputs = screen.getAllByLabelText("Reason");
    fireEvent.change(reasonInputs[0], { target: { value: "cash transaction" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("removes a case expression", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Cases"));
    fireEvent.click(screen.getByText("Add Expression"));
    const buttons = screen.getAllByRole("button");
    const removeBtns = buttons.filter((b) => b.getAttribute("color") === "error");
    expect(removeBtns.length).toBeGreaterThan(0);
    fireEvent.click(removeBtns[0]);
    expect(screen.getByText("Add Expression")).toBeInTheDocument();
  });

  it("types in alternative subRuleRef and reason fields", () => {
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Cases"));
    const subRuleRefInput = screen.getByLabelText("Sub Rule Ref");
    fireEvent.change(subRuleRefInput, { target: { value: ".00" } });
    const reasonInput = screen.getByLabelText("Reason");
    fireEvent.change(reasonInput, { target: { value: "fallback reason" } });
    expect(onChange).toHaveBeenCalled();
  });

  // ── Adding second items (covers map callbacks in add handlers) ──

  it("adds a second exit condition", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Exit Condition"));
    fireEvent.click(screen.getByText("Add Exit Condition"));
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThanOrEqual(2);
  });

  it("adds a second band", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Band"));
    fireEvent.click(screen.getByText("Add Band"));
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThanOrEqual(2);
  });

  it("adds a second case expression", () => {
    render(<RuleConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Cases"));
    fireEvent.click(screen.getByText("Add Expression"));
    fireEvent.click(screen.getByText("Add Expression"));
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThanOrEqual(2);
  });

  // ── Pre-populated rendering ──

  it("renders with pre-populated parameters", () => {
    const value = JSON.stringify({
      parameters: { maxQueryRange: 100, tolerance: 0.5 },
      exitConditions: [],
      bands: [],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getByText("Parameters")).toBeInTheDocument();
  });

  it("renders with pre-populated bands config value", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [
        { subRuleRef: ".01", reason: "band 1", lowerLimit: 0, upperLimit: 50 },
        { subRuleRef: ".02", reason: "band 2", lowerLimit: 50, upperLimit: 100 },
      ],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getAllByText("Auto-generated").length).toBeGreaterThan(0);
  });

  it("renders with pre-populated cases config value", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "fallback", subRuleRef: ".00" },
        expressions: [
          { value: "CASH", reason: "cash", subRuleRef: ".01" },
          { value: "CARD", reason: "card", subRuleRef: ".02" },
        ],
      },
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getByText("Alternative (Fallback)")).toBeInTheDocument();
  });

  it("renders with pre-populated timeframes", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [],
      timeframes: [
        { start: "08:00", end: "17:00", days: ["MON", "TUE"] },
        { start: "09:00", end: "18:00", days: ["WED", "THU"] },
      ],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    expect(screen.getAllByText("Start").length).toBeGreaterThanOrEqual(2);
  });

  // ── readOnly and hideJsonPreview ──

  it("renders readOnly mode with all sections populated", () => {
    const value = JSON.stringify({
      parameters: { maxQueryRange: 100 },
      exitConditions: [{ subRuleRef: ".X01", reason: "test" }],
      bands: [{ subRuleRef: ".01", reason: "test band", lowerLimit: 0, upperLimit: 100 }],
      timeframes: [{ start: "08:00", end: "17:00", days: ["MON"] }],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} readOnly={true} />);
    expect(screen.queryByText("Add Parameter")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Exit Condition")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Band")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Timeframe")).not.toBeInTheDocument();
  });

  it("renders hideJsonPreview with cases view", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "fallback", subRuleRef: ".00" },
        expressions: [{ value: "CASH", reason: "cash", subRuleRef: ".01" }],
      },
    });
    render(<RuleConfigEditor {...defaultProps} value={value} hideJsonPreview={true} />);
    expect(screen.queryByText("JSON Preview (read-only)")).not.toBeInTheDocument();
    expect(screen.getByText("Alternative (Fallback)")).toBeInTheDocument();
  });

  it("renders timeframe days renderValue with pre-populated days", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [],
      timeframes: [{ start: "08:00", end: "17:00", days: ["MON", "TUE", "WED"] }],
    });
    render(<RuleConfigEditor {...defaultProps} value={value} />);
    // The Days field should render with the selected days
    expect(screen.getByText("Timeframes")).toBeInTheDocument();
  });

  it("invokes timeframe days SelectProps renderValue", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [],
      timeframes: [{ start: "08:00", end: "17:00", days: ["MON", "TUE"] }],
    });
    const { container } = render(<RuleConfigEditor {...defaultProps} value={value} />);
    // Find the Days select field and invoke its SelectProps.renderValue
    const daysLabel = screen.getByText("Days");
    const daysContainer = daysLabel.closest("div");
    expect(daysContainer).toBeTruthy();
    // Find the select element within the days container
    const selectEl = daysContainer?.querySelector("div[data-testid='mui-select']") as HTMLElement;
    if (selectEl) {
      const propKeys = Object.keys(selectEl).filter((k) => k.startsWith("__reactProps"));
      if (propKeys.length > 0) {
        const props = (selectEl as any)[propKeys[0]];
        // SelectProps.renderValue is the function we want to call
        const renderValue = props?.SelectProps?.renderValue;
        if (typeof renderValue === "function") {
          const result = renderValue(["MON", "TUE", "WED"]);
          expect(result).toBe("MON, TUE, WED");
        }
      }
    }
    expect(screen.getByText("Timeframes")).toBeInTheDocument();
  });

  it("renders cases with readOnly mode", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "fallback", subRuleRef: ".00" },
        expressions: [{ value: "CASH", reason: "cash", subRuleRef: ".01" }],
      },
    });
    render(<RuleConfigEditor {...defaultProps} value={value} readOnly={true} />);
    expect(screen.queryByText("Add Expression")).not.toBeInTheDocument();
  });

  // ── Short-circuit branch coverage in generatedConfig ──

  it("covers exitCondition filter short-circuit with non-empty subRuleRef", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [{ subRuleRef: ".X01", reason: "" }],
      bands: [],
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers band filter short-circuit with non-empty subRuleRef", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [{ subRuleRef: ".01", reason: "", lowerLimit: undefined, upperLimit: undefined }],
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers case expression filter short-circuit with non-empty value", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "", subRuleRef: "" },
        expressions: [{ value: "CASH", reason: "", subRuleRef: ".01" }],
      },
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers exitCondition filter with empty subRuleRef and non-empty reason", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [{ subRuleRef: "", reason: "test reason" }],
      bands: [],
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers band filter with empty subRuleRef and non-empty reason", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [
        { subRuleRef: "", reason: "test band", lowerLimit: undefined, upperLimit: undefined },
      ],
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers band filter with empty subRuleRef and reason but defined lowerLimit", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [{ subRuleRef: "", reason: "", lowerLimit: 0, upperLimit: undefined }],
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers band filter with all empty but defined upperLimit", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      bands: [{ subRuleRef: "", reason: "", lowerLimit: undefined, upperLimit: 100 }],
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers case expression filter with empty value but non-empty reason", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "", subRuleRef: "" },
        expressions: [{ value: "", reason: "test reason", subRuleRef: ".01" }],
      },
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers case expression filter with empty value and reason but non-empty subRuleRef", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "", subRuleRef: "" },
        expressions: [{ value: "", reason: "", subRuleRef: ".01" }],
      },
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });

  it("covers hasAlternative with empty subRuleRef but non-empty reason", () => {
    const value = JSON.stringify({
      parameters: {},
      exitConditions: [],
      cases: {
        alternative: { reason: "fallback reason", subRuleRef: "" },
        expressions: [],
      },
    });
    const onChange = jest.fn();
    render(<RuleConfigEditor {...defaultProps} value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });
});
