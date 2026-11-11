import React from "react";

/**
 * Comprehensive @mui/material mock for Jest tests.
 * Every component is a pass-through that renders children.
 */

// Helper to call function-valued properties in sx objects
const callSxFunctions = (sx: unknown) => {
  if (typeof sx === "function") {
    sx({
      palette: { background: { default: "#fff", paper: "#fff" } },
      spacing: (n: number) => n * 8,
      breakpoints: { up: () => "" },
    });
  } else if (sx && typeof sx === "object") {
    for (const key of Object.keys(sx)) {
      callSxFunctions((sx as Record<string, unknown>)[key]);
    }
  }
};

const makeComponent = (name: string) => {
  const Comp = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const { children, sx, ...rest } = props;
    callSxFunctions(sx);
    // Spread data-testid if provided so tests can find elements
    const testId = (props as any)["data-testid"];
    return React.createElement(
      "div",
      {
        "data-testid": testId || `mui-${name.toLowerCase()}`,
        ref,
        ...rest,
      },
      children,
    );
  });
  Comp.displayName = name;
  return Comp;
};

// Components used across the app
export const Box = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, component, sx, ...rest } = props;
  callSxFunctions(sx);
  const tag = (component as string) || "div";
  return React.createElement(tag, { ref, ...rest }, children);
});
Box.displayName = "Box";
export const Paper = makeComponent("Paper");
export const Typography = makeComponent("Typography");
export const Button = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, ...rest } = props;
  return React.createElement("button", { ref, type: "button", ...rest }, children);
});
Button.displayName = "Button";
export const IconButton = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, ...rest } = props;
  return React.createElement("button", { ref, type: "button", ...rest }, children);
});
IconButton.displayName = "IconButton";
export const TextField = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, label, id, helperText, slotProps, SelectProps, ...rest } = props;
  const fieldId =
    id || (label ? `field-${String(label).replace(/\s+/g, "-").toLowerCase()}` : undefined);
  // Extract adornments from slotProps.input if present
  const inputSlot = (slotProps as any)?.input;
  const startAdornment = inputSlot?.startAdornment;
  const endAdornment = inputSlot?.endAdornment;
  // Call SelectProps.renderValue if present (covers renderValue branch)
  if (SelectProps?.renderValue && rest.value != null) {
    try {
      SelectProps.renderValue(rest.value);
    } catch {
      /* ignore */
    }
  }
  return React.createElement(
    "div",
    { ref },
    label ? React.createElement("label", { htmlFor: fieldId }, label) : null,
    startAdornment,
    React.createElement("input", { id: fieldId, ...rest }),
    endAdornment,
    helperText ? React.createElement("div", null, helperText) : null,
    children,
  );
});
TextField.displayName = "TextField";
export const Dialog = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, open, onClose, ...rest } = props;
  if (!open) return null;
  return React.createElement(
    "div",
    { ref, role: "dialog", ...rest },
    React.createElement(
      "button",
      {
        "data-testid": "dialog-backdrop-close",
        onClick: onClose,
        style: { display: "none" },
      },
      "backdrop-close",
    ),
    children,
  );
});
Dialog.displayName = "Dialog";
export const DialogTitle = makeComponent("DialogTitle");
export const DialogContent = makeComponent("DialogContent");
export const DialogActions = makeComponent("DialogActions");
export const Divider = makeComponent("Divider");
export const Switch = makeComponent("Switch");
export const FormControlLabel = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, control, label, ...rest } = props;
  return React.createElement("div", { ref, ...rest }, control, label, children);
});
FormControlLabel.displayName = "FormControlLabel";
export const Tooltip = makeComponent("Tooltip");
export const InputAdornment = makeComponent("InputAdornment");
export const AppBar = makeComponent("AppBar");
export const Toolbar = makeComponent("Toolbar");
export const CssBaseline = makeComponent("CssBaseline");
export const Snackbar = makeComponent("Snackbar");
export const Alert = makeComponent("Alert");
export const Pagination = makeComponent("Pagination");
export const List = makeComponent("List");
export const ListItem = makeComponent("ListItem");
export const ListItemButton = makeComponent("ListItemButton");
export const ListItemIcon = makeComponent("ListItemIcon");
export const ListItemText = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, primary, ...rest } = props;
  return React.createElement("div", { ref, ...rest }, primary ?? children);
});
ListItemText.displayName = "ListItemText";
export const Avatar = makeComponent("Avatar");
export const Drawer = makeComponent("Drawer");
export const Collapse = makeComponent("Collapse");
export const CircularProgress = makeComponent("CircularProgress");
export const Checkbox = makeComponent("Checkbox");
export const FormControl = makeComponent("FormControl");
export const FormHelperText = makeComponent("FormHelperText");
export const InputLabel = makeComponent("InputLabel");
export const Select = makeComponent("Select");
export const MenuItem = makeComponent("MenuItem");
export const Grid = makeComponent("Grid");
export const Stack = makeComponent("Stack");
export const Container = makeComponent("Container");
export const Card = makeComponent("Card");
export const CardContent = makeComponent("CardContent");
export const CardHeader = makeComponent("CardHeader");
export const CardActions = makeComponent("CardActions");
export const Tabs = makeComponent("Tabs");
export const Tab = makeComponent("Tab");
export const Table = makeComponent("Table");
export const TableBody = makeComponent("TableBody");
export const TableCell = makeComponent("TableCell");
export const TableContainer = makeComponent("TableContainer");
export const TableHead = makeComponent("TableHead");
export const TableRow = makeComponent("TableRow");
export const TablePagination = makeComponent("TablePagination");
export const TableSortLabel = makeComponent("TableSortLabel");
export const Autocomplete = makeComponent("Autocomplete");
export const Breadcrumbs = makeComponent("Breadcrumbs");
export const Chip = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, label, ...rest } = props;
  return React.createElement("div", { ref, ...rest }, label ?? children);
});
Chip.displayName = "Chip";
export const LinearProgress = makeComponent("LinearProgress");
export const Menu = makeComponent("Menu");
export const Modal = makeComponent("Modal");
export const Popover = makeComponent("Popover");
export const Radio = makeComponent("Radio");
export const RadioGroup = makeComponent("RadioGroup");
export const Slider = makeComponent("Slider");
export const Stepper = makeComponent("Stepper");
export const Step = makeComponent("Step");
export const StepLabel = makeComponent("StepLabel");
export const TextareaAutosize = makeComponent("TextareaAutosize");
export const Backdrop = makeComponent("Backdrop");
export const Badge = makeComponent("Badge");
export const Accordion = makeComponent("Accordion");
export const AccordionSummary = makeComponent("AccordionSummary");
export const AccordionDetails = makeComponent("AccordionDetails");
export const Link = makeComponent("Link");
export const ListSubheader = makeComponent("ListSubheader");
export const Fade = makeComponent("Fade");
export const Grow = makeComponent("Grow");
export const Slide = makeComponent("Slide");
export const Zoom = makeComponent("Zoom");
export const Skeleton = makeComponent("Skeleton");
// ToggleButton is defined above with ToggleButtonGroup
// Context for ToggleButtonGroup to pass onChange to ToggleButton
const ToggleGroupContext = React.createContext<{
  value?: unknown;
  onChange?: (e: unknown, val: unknown) => void;
}>({});

export const ToggleButtonGroup = React.forwardRef<unknown, Record<string, unknown>>(
  (props, ref) => {
    const { children, value, onChange6, onChange, ...rest } = props;
    return React.createElement(
      ToggleGroupContext.Provider,
      { value: { value, onChange } },
      React.createElement("div", { ref, role: "group", ...rest }, children),
    );
  },
);
ToggleButtonGroup.displayName = "ToggleButtonGroup";

export const ToggleButton = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, value, ...rest } = props;
  const ctx = React.useContext(ToggleGroupContext);
  return React.createElement(
    "button",
    {
      ref,
      type: "button",
      "data-value": value,
      onClick: () => {
        if (ctx.onChange) ctx.onChange({}, value);
      },
      ...rest,
    },
    children,
  );
});
ToggleButton.displayName = "ToggleButton";

// Hooks
// The result is configurable so tests can exercise responsive branches.
export const useMediaQuery = () =>
  (globalThis as { __MUI_USE_MEDIA_QUERY__?: boolean }).__MUI_USE_MEDIA_QUERY__ === true;

// Types
export type AlertColor = "success" | "info" | "warning" | "error";

// Default export — a pass-through component so `import X from '@mui/material/X'` works
const MuiDefaultComponent = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
  const { children, primary, label, helperText, ...rest } = props;
  return React.createElement(
    "div",
    { ref, ...rest },
    primary ?? label ?? null,
    children,
    helperText ? React.createElement("div", null, helperText) : null,
  );
});
MuiDefaultComponent.displayName = "MuiDefaultComponent";

export default MuiDefaultComponent;
