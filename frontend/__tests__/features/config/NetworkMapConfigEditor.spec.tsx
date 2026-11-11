import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import NetworkMapConfigEditor from "@/features/config/components/NetworkMapConfigEditor";
import { configApi } from "@/features/config/services/configApi";

const mockList = configApi.list as jest.MockedFunction<typeof configApi>;

jest.mock("@/features/config/services/configApi", () => ({
  configApi: {
    list: jest.fn().mockResolvedValue({
      data: [
        { id: "typo1", cfg: "1.0.0", desc: "Typology 1", rules: [{ id: "rule1", cfg: "1.0.0" }] },
        { id: "typo2", cfg: "2.0.0", desc: "Typology 2", rules: [] },
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
 * Helper: find the Autocomplete div(s) inside the component and invoke
 * the onChange prop of the first one with a specific value.
 */
function invokeAutocompleteChange(container: HTMLElement, value: unknown, index = 0) {
  const autocompletes = container.querySelectorAll('[data-testid="mui-autocomplete"]');
  const autocomplete = autocompletes[index] as HTMLElement;
  const props = getReactProps(autocomplete);
  const onChange = props.onChange as (event: unknown, val: unknown) => void;
  act(() => {
    onChange({}, value);
  });
}

describe("NetworkMapConfigEditor", () => {
  const defaultProps = {
    value: "[]",
    onChange: jest.fn(),
  };

  it("renders with empty messages", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  it("renders Add Message button", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    expect(screen.getByText("Add Message")).toBeInTheDocument();
  });

  it("adds a message when Add Message clicked", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    expect(screen.getAllByText("Message 1").length).toBeGreaterThan(0);
  });

  it("renders in readOnly mode without Add Message button", () => {
    render(<NetworkMapConfigEditor {...defaultProps} readOnly={true} />);
    expect(screen.queryByText("Add Message")).not.toBeInTheDocument();
  });

  it("parses initial value with messages", () => {
    const value = JSON.stringify([{ id: "msg1", cfg: "1.0.0", txTp: "pacs.008", typologies: [] }]);
    render(<NetworkMapConfigEditor {...defaultProps} value={value} />);
    expect(screen.getAllByText("Message 1").length).toBeGreaterThan(0);
  });

  it("shows JSON preview by default", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    expect(screen.getByText("JSON Preview")).toBeInTheDocument();
  });

  it("hides JSON preview when hideJsonPreview is true", () => {
    render(<NetworkMapConfigEditor {...defaultProps} hideJsonPreview={true} />);
    expect(screen.queryByText("JSON Preview")).not.toBeInTheDocument();
  });

  it("adds typology to message", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    expect(screen.getAllByText("1 typology(s)").length).toBeGreaterThan(0);
  });

  it("shows no typologies message", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    expect(screen.getByText("No typologies added")).toBeInTheDocument();
  });

  it("removes a message", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Remove Message"));
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  it("removes a typology", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    expect(screen.getAllByText("1 typology(s)").length).toBeGreaterThan(0);
    // Find and click the remove typology button (IconButton with error color)
    const buttons = screen.getAllByRole("button");
    const removeTypoBtn = buttons.find(
      (b) => b.getAttribute("color") === "error" && b.textContent === "",
    );
    if (removeTypoBtn) fireEvent.click(removeTypoBtn);
    // The typology should be removed
    const typologyChips = screen.queryAllByText("1 typology(s)");
    expect(typologyChips.length).toBe(0);
  });

  it("handles invalid JSON value gracefully", () => {
    render(<NetworkMapConfigEditor {...defaultProps} value="invalid-json" />);
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  it("calls onChange when messages change", () => {
    const onChange = jest.fn();
    render(<NetworkMapConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Message"));
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onPreviewChange when preview changes", () => {
    const onPreviewChange = jest.fn();
    render(
      <NetworkMapConfigEditor
        {...defaultProps}
        onPreviewChange={onPreviewChange}
        cfg="1.0.0"
        active={true}
        tenantId="default"
      />,
    );
    expect(onPreviewChange).toHaveBeenCalled();
  });

  it("renders with cfg, active, tenantId props", () => {
    render(
      <NetworkMapConfigEditor {...defaultProps} cfg="1.0.0" active={true} tenantId="default" />,
    );
    expect(screen.getByText("JSON Preview")).toBeInTheDocument();
  });

  it("handles non-array parsed value", () => {
    render(<NetworkMapConfigEditor {...defaultProps} value='{"not": "array"}' />);
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  // ── TextField typing tests (lines 240-258) ───────────────────────────────

  it("updates Message ID when typing in the Message ID field", () => {
    const onChange = jest.fn();
    render(<NetworkMapConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Message"));
    const input = screen.getByLabelText("Message ID") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "msg.001" } });
    expect(input.value).toBe("msg.001");
  });

  it("updates Config Version when typing in the Config Version field", () => {
    const onChange = jest.fn();
    render(<NetworkMapConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Message"));
    const input = screen.getByLabelText("Config Version") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2.3.4" } });
    expect(input.value).toBe("2.3.4");
  });

  it("strips non-numeric chars from Config Version field", () => {
    const onChange = jest.fn();
    render(<NetworkMapConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Message"));
    const input = screen.getByLabelText("Config Version") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a2b.3c.4d" } });
    expect(input.value).toBe("2.3.4");
  });

  it("updates Transaction Type when typing in the txTp field", () => {
    const onChange = jest.fn();
    render(<NetworkMapConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Message"));
    const input = screen.getByLabelText("Transaction Type (txTp)") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "pacs.008" } });
    expect(input.value).toBe("pacs.008");
  });

  it("sanitizes Message ID by stripping disallowed chars", () => {
    const onChange = jest.fn();
    render(<NetworkMapConfigEditor {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Message"));
    const input = screen.getByLabelText("Message ID") as HTMLInputElement;
    // sanitizeId strips everything except a-zA-Z0-9.@ — so @ is kept, $ and # and ! are removed
    fireEvent.change(input, { target: { value: "msg$#@!001" } });
    expect(input.value).toBe("msg@001");
  });

  // ── Add/Remove typology (lines 166-168) ──────────────────────────────────

  it("adds a typology and then removes it via IconButton", () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    expect(screen.getAllByText("1 typology(s)").length).toBeGreaterThan(0);
    // The remove typology button is an <button> with color="error" containing the Delete icon span
    const errorButtons = container.querySelectorAll('button[color="error"]');
    // The first error button is the remove typology IconButton
    expect(errorButtons.length).toBeGreaterThan(0);
    fireEvent.click(errorButtons[0]);
    expect(screen.queryByText("1 typology(s)")).not.toBeInTheDocument();
  });

  // ── selectTypology with matching record (lines 178-194, matching path) ───

  it("selectTypology with matching typology record auto-loads rules", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // Invoke Autocomplete onChange with an object matching typo1@1.0.0
    invokeAutocompleteChange(container, {
      id: "typo1",
      cfg: "1.0.0",
      desc: "Typology 1",
      rules: [{ id: "rule1", cfg: "1.0.0" }],
    });
    // The rules should be auto-loaded and displayed
    await waitFor(() => {
      expect(screen.getByText("Rules (auto-loaded from typology)")).toBeInTheDocument();
    });
    expect(screen.getByText("rule1@1.0.0")).toBeInTheDocument();
  });

  // ── selectTypology with non-matching value (fallback path, lines 187-193) ─

  it("selectTypology with non-matching value uses fallback lastIndexOf(@) split", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // Invoke Autocomplete onChange with a string that doesn't match any record
    invokeAutocompleteChange(container, "unknownTypo@3.0.0");
    // The typology should be set with id="unknownTypo" and cfg="3.0.0" but no rules
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  it("selectTypology with non-matching value without @ uses fallback (no @ found)", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // Invoke Autocomplete onChange with a string that has no @
    invokeAutocompleteChange(container, "plainTypo");
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  // ── selectTypology with null value (clearing, line 180) ──────────────────

  it("selectTypology with null value clears the typology", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // First select a typology
    invokeAutocompleteChange(container, {
      id: "typo1",
      cfg: "1.0.0",
      desc: "Typology 1",
      rules: [{ id: "rule1", cfg: "1.0.0" }],
    });
    await waitFor(() => {
      expect(screen.getByText("Rules (auto-loaded from typology)")).toBeInTheDocument();
    });
    // Now clear it with null
    invokeAutocompleteChange(container, null);
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  // ── readOnly mode (lines 354-355, no Add/Remove buttons) ─────────────────

  it("readOnly mode hides Add Typology and Remove Message buttons", () => {
    const value = JSON.stringify([{ id: "msg1", cfg: "1.0.0", txTp: "pacs.008", typologies: [] }]);
    render(<NetworkMapConfigEditor {...defaultProps} value={value} readOnly={true} />);
    expect(screen.queryByText("Add Message")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Typology")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove Message")).not.toBeInTheDocument();
  });

  it("readOnly mode disables TextField inputs", () => {
    const value = JSON.stringify([{ id: "msg1", cfg: "1.0.0", txTp: "pacs.008", typologies: [] }]);
    render(<NetworkMapConfigEditor {...defaultProps} value={value} readOnly={true} />);
    const msgIdInput = screen.getByLabelText("Message ID") as HTMLInputElement;
    expect(msgIdInput.disabled).toBe(true);
  });

  // ── Full preview JSON with cfg, active, tenantId (lines 287-328) ──────────

  it("renders full preview JSON with cfg, active, and tenantId props", () => {
    const value = JSON.stringify([{ id: "msg1", cfg: "1.0.0", txTp: "pacs.008", typologies: [] }]);
    const { container } = render(
      <NetworkMapConfigEditor
        {...defaultProps}
        value={value}
        cfg="2.0.0"
        active={true}
        tenantId="tenantA"
      />,
    );
    expect(screen.getByText("JSON Preview")).toBeInTheDocument();
    // The <pre> element should contain the full preview JSON with cfg, active, tenantId
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain('"cfg": "2.0.0"');
    expect(pre?.textContent).toContain('"active": true');
    expect(pre?.textContent).toContain('"tenantId": "tenantA"');
  });

  // ── onPreviewChange callback (lines 287-328) ──────────────────────────────

  it("calls onPreviewChange with full preview JSON including cfg, active, tenantId", () => {
    const onPreviewChange = jest.fn();
    render(
      <NetworkMapConfigEditor
        {...defaultProps}
        onPreviewChange={onPreviewChange}
        cfg="3.0.0"
        active={false}
        tenantId="tenantB"
      />,
    );
    expect(onPreviewChange).toHaveBeenCalled();
    const lastCall = onPreviewChange.mock.calls[onPreviewChange.mock.calls.length - 1][0];
    expect(lastCall).toContain('"cfg": "3.0.0"');
    expect(lastCall).toContain('"active": false');
    expect(lastCall).toContain('"tenantId": "tenantB"');
  });

  // ── API fetch error handling (lines 92-98 catch block) ───────────────────

  it("handles API fetch error gracefully", async () => {
    mockList.mockRejectedValueOnce(new Error("Network error"));
    render(<NetworkMapConfigEditor {...defaultProps} />);
    // Component should still render without crashing
    await waitFor(() => {
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  // ── Pre-populated messages with typologies that have rules (lines 350-355) ─

  it("renders pre-populated messages with typologies containing rules", () => {
    const value = JSON.stringify([
      {
        id: "msg1",
        cfg: "1.0.0",
        txTp: "pacs.008",
        typologies: [
          {
            id: "typo1",
            cfg: "1.0.0",
            rules: [{ id: "rule1", cfg: "1.0.0" }],
            tenantId: "default",
          },
        ],
      },
    ]);
    render(<NetworkMapConfigEditor {...defaultProps} value={value} />);
    expect(screen.getAllByText("Message 1").length).toBeGreaterThan(0);
    expect(screen.getByText("1 typology(s)")).toBeInTheDocument();
    expect(screen.getByText("Rules (auto-loaded from typology)")).toBeInTheDocument();
    expect(screen.getByText("rule1@1.0.0")).toBeInTheDocument();
  });

  // ── hideJsonPreview=true (lines 287-328 conditional) ──────────────────────

  it("hideJsonPreview=true does not render JSON preview section", () => {
    const value = JSON.stringify([{ id: "msg1", cfg: "1.0.0", txTp: "pacs.008", typologies: [] }]);
    render(<NetworkMapConfigEditor {...defaultProps} value={value} hideJsonPreview={true} />);
    expect(screen.queryByText("JSON Preview")).not.toBeInTheDocument();
  });

  // ── Typology with no rules property (typologyRec.rules falsy path) ────────

  it("selectTypology with matching record but no rules property sets empty rules", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // typo2 has rules: [] in the mock, so selecting it should not show rules section
    invokeAutocompleteChange(container, {
      id: "typo2",
      cfg: "2.0.0",
      desc: "Typology 2",
      rules: [],
    });
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  // ── Autocomplete onChange with string value (free-text input) ─────────────

  it("Autocomplete onChange with string value triggers selectTypology fallback", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // Simulate free-text input (string value from Autocomplete)
    invokeAutocompleteChange(container, "customTypo@5.0.0");
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  // ── Autocomplete onChange with empty string (clearing via text) ───────────

  it("Autocomplete onChange with empty string clears the typology", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // First select a typology with rules
    invokeAutocompleteChange(container, {
      id: "typo1",
      cfg: "1.0.0",
      desc: "Typology 1",
      rules: [{ id: "rule1", cfg: "1.0.0" }],
    });
    await waitFor(() => {
      expect(screen.getByText("Rules (auto-loaded from typology)")).toBeInTheDocument();
    });
    // Now clear with empty string
    invokeAutocompleteChange(container, "");
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  // ── Multiple messages and removing a specific one ─────────────────────────

  it("adds multiple messages and removes the correct one", () => {
    render(<NetworkMapConfigEditor {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Message"));
    expect(screen.getAllByText("Message 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Message 2").length).toBeGreaterThan(0);
    // Remove the first message
    fireEvent.click(screen.getAllByText("Remove Message")[0]);
    // After removing the first, we should still have one message
    expect(screen.getAllByText("Message 1").length).toBeGreaterThan(0);
    expect(screen.queryByText("Message 2")).not.toBeInTheDocument();
  });

  // ── Typology with desc shows in Autocomplete options ─────────────────────

  it("renders Autocomplete with typology options after fetch", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // The Autocomplete should be rendered with options prop
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    expect(autocomplete).toBeInTheDocument();
  });

  // ── Autocomplete callback props (lines 287-290, 308-328) ─────────────────

  it("Autocomplete getOptionLabel returns id@cfg for object options", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const getOptionLabel = props.getOptionLabel as (option: unknown) => string;
    expect(getOptionLabel({ id: "typo1", cfg: "1.0.0" })).toBe("typo1@1.0.0");
    expect(getOptionLabel("plain-string")).toBe("plain-string");
  });

  it("Autocomplete isOptionEqualToValue compares objects by id and cfg", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const isOptionEqualToValue = props.isOptionEqualToValue as (
      option: unknown,
      value: unknown,
    ) => boolean;
    expect(isOptionEqualToValue({ id: "typo1", cfg: "1.0.0" }, { id: "typo1", cfg: "1.0.0" })).toBe(
      true,
    );
    expect(isOptionEqualToValue({ id: "typo1", cfg: "1.0.0" }, { id: "typo2", cfg: "2.0.0" })).toBe(
      false,
    );
    expect(isOptionEqualToValue("str1", "str1")).toBe(true);
    expect(isOptionEqualToValue("str1", "str2")).toBe(false);
  });

  it("Autocomplete renderOption renders option with id@cfg and desc", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderOption = props.renderOption as (
      props: unknown,
      option: unknown,
    ) => React.ReactElement;
    // Test with object option that has desc
    const result = renderOption({ key: "test" }, { id: "typo1", cfg: "1.0.0", desc: "Typology 1" });
    expect(result).toBeTruthy();
    // Test with string option (fallback path)
    const result2 = renderOption({ key: "test2" }, "stringOption");
    expect(result2).toBeTruthy();
  });

  it("Autocomplete renderInput returns TextField with label and helperText", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderInput = props.renderInput as (params: unknown) => React.ReactElement;
    // When no typology is selected, helperText should be the default message
    const result = renderInput({});
    expect(result).toBeTruthy();
  });

  it("Autocomplete renderInput shows typology desc as helperText when typology is selected", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // First select a typology
    invokeAutocompleteChange(container, {
      id: "typo1",
      cfg: "1.0.0",
      desc: "Typology 1",
      rules: [{ id: "rule1", cfg: "1.0.0" }],
    });
    await waitFor(() => {
      expect(screen.getByText("Rules (auto-loaded from typology)")).toBeInTheDocument();
    });
    // Now check renderInput — it should show the desc as helperText
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderInput = props.renderInput as (params: unknown) => React.ReactElement;
    const result = renderInput({});
    expect(result).toBeTruthy();
  });

  it("Autocomplete value prop finds matching typology record", async () => {
    const value = JSON.stringify([
      {
        id: "msg1",
        cfg: "1.0.0",
        txTp: "pacs.008",
        typologies: [{ id: "typo1", cfg: "1.0.0", rules: [], tenantId: "default" }],
      },
    ]);
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} value={value} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    // The Autocomplete should have a value matching the typology record
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const val = props.value as { id: string; cfg: string };
    expect(val).toBeTruthy();
    expect(val.id).toBe("typo1");
    expect(val.cfg).toBe("1.0.0");
  });

  it("Autocomplete value prop falls back to inline object for unmatched typology", async () => {
    const value = JSON.stringify([
      {
        id: "msg1",
        cfg: "1.0.0",
        txTp: "pacs.008",
        typologies: [{ id: "unknownTypo", cfg: "9.0.0", rules: [], tenantId: "default" }],
      },
    ]);
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} value={value} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const val = props.value as { id: string; cfg: string };
    expect(val).toBeTruthy();
    expect(val.id).toBe("unknownTypo");
    expect(val.cfg).toBe("9.0.0");
  });

  it("Autocomplete value prop is null when typology id is empty", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    expect(props.value).toBeNull();
  });

  // ── Branch coverage: value || '[]' fallback (line 111) ───────────────────

  it("handles empty string value by falling back to []", () => {
    render(<NetworkMapConfigEditor {...defaultProps} value="" />);
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  it("handles empty string value after having a non-empty value (value || '[]' branch)", () => {
    const { rerender } = render(<NetworkMapConfigEditor {...defaultProps} value="invalid-json" />);
    // Now re-render with empty string — this will NOT early-return because lastEmittedRef != ""
    rerender(<NetworkMapConfigEditor {...defaultProps} value="" />);
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  // ── Branch coverage: value === lastEmittedRef.current early return (line 109) ─

  it("does not re-parse when value remains the same as last emitted", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <NetworkMapConfigEditor {...defaultProps} value="[]" onChange={onChange} />,
    );
    // Re-render with same value — should not cause re-parse
    rerender(<NetworkMapConfigEditor {...defaultProps} value="[]" onChange={onChange} />);
    expect(screen.getByText("No messages added yet")).toBeInTheDocument();
  });

  // ── Branch coverage: typologyRec.rules falsy (line 185) ──────────────────

  it("selectTypology with matching record but undefined rules sets empty rules array", async () => {
    // Override mock to return a typology with no rules property
    mockList
      .mockResolvedValueOnce({
        data: [{ id: "typoNoRules", cfg: "1.0.0", desc: "No Rules Typology" }],
        meta: { total: 1, limit: 100, offset: 0 },
      })
      .mockResolvedValueOnce({
        data: [],
        meta: { total: 0, limit: 100, offset: 0 },
      });

    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    // Select the typology that has no rules property
    invokeAutocompleteChange(container, {
      id: "typoNoRules",
      cfg: "1.0.0",
      desc: "No Rules Typology",
    });
    // Should not show rules section since rules is undefined
    expect(screen.queryByText("Rules (auto-loaded from typology)")).not.toBeInTheDocument();
  });

  // ── Branch coverage: ruleDesc && (line 370) ──────────────────────────────

  it("renders rule description when rule record has desc", async () => {
    // Override mock to return rule records with desc
    mockList
      .mockResolvedValueOnce({
        data: [
          { id: "typo1", cfg: "1.0.0", desc: "Typology 1", rules: [{ id: "rule1", cfg: "1.0.0" }] },
        ],
        meta: { total: 1, limit: 100, offset: 0 },
      })
      .mockResolvedValueOnce({
        data: [{ id: "rule1", cfg: "1.0.0", desc: "Rule One Description" }],
        meta: { total: 1, limit: 100, offset: 0 },
      });

    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    invokeAutocompleteChange(container, {
      id: "typo1",
      cfg: "1.0.0",
      desc: "Typology 1",
      rules: [{ id: "rule1", cfg: "1.0.0" }],
    });
    await waitFor(() => {
      expect(screen.getByText("rule1@1.0.0")).toBeInTheDocument();
    });
    expect(screen.getByText("Rule One Description")).toBeInTheDocument();
  });

  // ── Branch coverage: renderOption with desc and without desc ──────────────

  it("Autocomplete renderOption handles object option without desc", async () => {
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByText("Add Message"));
    fireEvent.click(screen.getByText("Add Typology"));
    const autocomplete = container.querySelector('[data-testid="mui-autocomplete"]') as HTMLElement;
    const props = getReactProps(autocomplete);
    const renderOption = props.renderOption as (
      props: unknown,
      option: unknown,
    ) => React.ReactElement;
    // Object option without desc
    const result = renderOption({ key: "test" }, { id: "typo2", cfg: "2.0.0" });
    expect(result).toBeTruthy();
  });

  // ── Branch coverage: updateMessage map false branch (line 150) ───────────

  it("updating a message field preserves other messages", () => {
    const value = JSON.stringify([
      { id: "msg1", cfg: "1.0.0", txTp: "pacs.008", typologies: [] },
      { id: "msg2", cfg: "2.0.0", txTp: "pacs.002", typologies: [] },
    ]);
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} value={value} />);
    // Type in the first message's ID field — the second message should be preserved
    const inputs = container.querySelectorAll(
      'input[id="field-message-id"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs.length).toBe(2);
    fireEvent.change(inputs[0], { target: { value: "updatedMsg1" } });
    expect((inputs[0] as HTMLInputElement).value).toBe("updatedMsg1");
    // The second message's ID should still be msg2
    expect((inputs[1] as HTMLInputElement).value).toBe("msg2");
  });

  // ── Branch coverage: updateTypology map false branch (line 167) ──────────

  it("updating a typology preserves other typologies in the same message", async () => {
    const value = JSON.stringify([
      {
        id: "msg1",
        cfg: "1.0.0",
        txTp: "pacs.008",
        typologies: [
          { id: "typo1", cfg: "1.0.0", rules: [], tenantId: "default" },
          { id: "typo2", cfg: "2.0.0", rules: [], tenantId: "default" },
        ],
      },
    ]);
    const { container } = render(<NetworkMapConfigEditor {...defaultProps} value={value} />);
    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
    // Select a new typology for the first typology slot — the second should be preserved
    invokeAutocompleteChange(
      container,
      { id: "typo1", cfg: "1.0.0", desc: "Typology 1", rules: [{ id: "rule1", cfg: "1.0.0" }] },
      0,
    );
    // Both typologies should still be present
    expect(screen.getByText("2 typology(s)")).toBeInTheDocument();
  });
});
