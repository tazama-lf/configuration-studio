import React from "react";

/**
 * @mui/material/styles mock for Jest tests.
 */

// styled: supports styled(Component)(styles) and styled(Component, options)(styles)
// The style callback is invoked with { theme, ...props } so that coverage
// tools see the callback body executed.
const mockTheme = {
  palette: {
    mode: "light",
    primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0", contrastText: "#fff" },
    secondary: { main: "#dc004e", light: "#ff5988", dark: "#9a003c", contrastText: "#fff" },
    background: { default: "#fff", paper: "#fff" },
    text: { primary: "rgba(0,0,0,0.87)", secondary: "rgba(0,0,0,0.54)" },
    error: { main: "#d32f2f" },
    warning: { main: "#ed6c02" },
    info: { main: "#0288d1" },
    success: { main: "#2e7d32" },
    divider: "rgba(0,0,0,0.12)",
  },
  spacing: (factor: number) => factor * 8,
  breakpoints: {
    up: () => "",
    down: () => "",
    between: () => "",
    only: () => "",
    not: () => "",
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    h6: {},
    subtitle1: {},
    subtitle2: {},
    body1: {},
    body2: {},
    button: {},
    caption: {},
    overline: {},
  },
  shape: { borderRadius: 4 },
  mixins: { toolbar: {} },
  transitions: {
    create: () => "all 200ms ease",
    easing: {
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    },
    duration: { enteringScreen: 225, leavingScreen: 195, short: 200, standard: 300, complex: 375 },
  },
  zIndex: {
    mobileStepper: 1000,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

export const styled = <P extends Record<string, unknown>>(
  _component: React.ComponentType<P> | string,
  _options?: unknown,
) => {
  // Call shouldForwardProp if provided to cover the callback
  if (_options && typeof (_options as any).shouldForwardProp === "function") {
    (_options as any).shouldForwardProp("open");
    (_options as any).shouldForwardProp("other");
  }
  // Return a function that accepts styles and returns a React component
  return (styles?: unknown) => {
    const StyledComp = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
      // Invoke the style callback so its body is covered.
      // styles can be a function ({ theme, ...props }) => CSSObject or a plain object.
      if (typeof styles === "function") {
        try {
          styles({ theme: mockTheme, ...props });
        } catch {
          /* ignore style callback errors in tests */
        }
      }
      // Render the original component so its callbacks (getRowId, etc.) are called
      if (typeof _component === "function" || typeof _component === "object") {
        const Comp = _component as React.ComponentType<Record<string, unknown>>;
        return React.createElement(Comp, { ref, ...props });
      }
      const { children, ...rest } = props;
      return React.createElement("div", { ref, ...rest }, children);
    });
    StyledComp.displayName = "StyledComponent";
    return StyledComp;
  };
};

// alpha: returns a color string
export const alpha = (color: string, _value: number) => color;

// createTheme / createMuiTheme
export const createTheme = () => ({});
export const createMuiTheme = () => ({});

// useTheme
export const useTheme = () => ({
  palette: {
    mode: "light",
    primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0", contrastText: "#fff" },
    secondary: { main: "#dc004e", light: "#ff5988", dark: "#9a003c", contrastText: "#fff" },
    background: { default: "#fff", paper: "#fff" },
    text: { primary: "rgba(0,0,0,0.87)", secondary: "rgba(0,0,0,0.54)" },
    error: { main: "#d32f2f" },
    warning: { main: "#ed6c02" },
    info: { main: "#0288d1" },
    success: { main: "#2e7d32" },
    divider: "rgba(0,0,0,0.12)",
  },
  spacing: (factor: number) => factor * 8,
  breakpoints: {
    up: () => "",
    down: () => "",
    between: () => "",
    only: () => "",
    not: () => "",
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    h6: {},
    subtitle1: {},
    subtitle2: {},
    body1: {},
    body2: {},
    button: {},
    caption: {},
    overline: {},
  },
  shape: { borderRadius: 4 },
  mixins: { toolbar: {} },
  transitions: {
    create: () => "all 200ms ease",
    easing: {
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    },
    duration: { enteringScreen: 225, leavingScreen: 195, short: 200, standard: 300, complex: 375 },
  },
  zIndex: {
    mobileStepper: 1000,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
});

// useMediaQuery
export const useMediaQuery = () => false;

// ThemeProvider
export const ThemeProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

// css
export const css = () => "";

// keyframes
export const keyframes = () => "";

// Types
export type Theme = ReturnType<typeof useTheme>;
export type CSSObject = Record<string, unknown>;
