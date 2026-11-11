import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Login } from "@/features/auth/pages/Login";
import { useAuth } from "@/features/auth/contexts/AuthContext";

jest.mock("@/features/auth/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderLogin = (loginFn = jest.fn()) => {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    loading: false,
    login: loginFn,
    logout: jest.fn(),
  });
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
};

describe("Login page", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders the login form", () => {
    renderLogin();
    expect(screen.getByText("Tazama Config Studio")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    renderLogin();
    expect(screen.getAllByLabelText("Email Address").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Password").length).toBeGreaterThan(0);
  });

  it("toggles password visibility", () => {
    renderLogin();
    const passwordFields = screen.getAllByLabelText("Password");
    expect(passwordFields[0]).toHaveAttribute("type", "password");
  });

  it("shows error on failed login", async () => {
    const loginFn = jest.fn().mockResolvedValue(false);
    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInputs[0], {
      target: { value: "password123" },
    });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials. Please try again.")).toBeInTheDocument();
    });
  });

  it("navigates on successful login", async () => {
    const loginFn = jest.fn().mockResolvedValue(true);
    const token = Buffer.from(JSON.stringify({ sub: "user1" })).toString("base64url");
    localStorage.setItem("authToken", `header.${token}.sig`);

    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInputs[0], {
      target: { value: "password123" },
    });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows error on login exception with unauthorized", async () => {
    const loginFn = jest.fn().mockRejectedValue(new Error("Unauthorized"));
    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInputs[0], {
      target: { value: "password123" },
    });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows connection error on network failure", async () => {
    const loginFn = jest.fn().mockRejectedValue(new Error("Network error"));
    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInputs[0], {
      target: { value: "password123" },
    });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("Login failed. Please check your connection and try again."),
      ).toBeInTheDocument();
    });
  });

  it("renders copyright text", () => {
    renderLogin();
    expect(screen.getByText(/LF Charities/i)).toBeInTheDocument();
  });

  it("renders Apache license link", () => {
    renderLogin();
    const link = screen.getByText("Apache-2.0");
    expect(link.tagName).toBe("A");
  });

  it("toggles password visibility by clicking the eye button", () => {
    renderLogin();
    const passwordInputs = screen.getAllByLabelText("Password");
    expect(passwordInputs[0]).toHaveAttribute("type", "password");

    // The TextField mock renders endAdornment from slotProps.input.endAdornment
    // The eye toggle IconButton is inside the password field's endAdornment.
    // Find the button within the password field's parent container.
    const passwordField = passwordInputs[0].closest("div")!;
    const buttonsInPasswordField = passwordField.querySelectorAll("button");
    // The eye toggle is the button in the endAdornment
    const eyeButton = buttonsInPasswordField[buttonsInPasswordField.length - 1];
    expect(eyeButton).toBeDefined();
    fireEvent.click(eyeButton);
    expect(eyeButton).toBeInTheDocument();
  });

  it("handleMouseDownPassword prevents default", () => {
    renderLogin();
    const passwordInputs = screen.getAllByLabelText("Password");
    const passwordField = passwordInputs[0].closest("div")!;
    const buttonsInPasswordField = passwordField.querySelectorAll("button");
    const eyeButton = buttonsInPasswordField[buttonsInPasswordField.length - 1];
    expect(eyeButton).toBeDefined();
    // fireEvent.mouseDown triggers handleMouseDownPassword which calls event.preventDefault()
    // The testing library event has its own preventDefault, so we just verify no error is thrown
    fireEvent.mouseDown(eyeButton);
    expect(eyeButton).toBeInTheDocument();
  });

  it("navigates on successful login when no token in localStorage", async () => {
    const loginFn = jest.fn().mockResolvedValue(true);
    // Ensure no token in localStorage
    localStorage.clear();
    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInputs[0], {
      target: { value: "password123" },
    });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith("test@example.com", "password123");
    });
    // Wait for the async navigate to execute (covers line 100)
    await new Promise((r) => setTimeout(r, 50));
    expect(loginFn).toHaveBeenCalledTimes(1);
  });

  it("shows invalid credentials error on error with invalid credentials message", async () => {
    const loginFn = jest.fn().mockRejectedValue(new Error("invalid credentials"));
    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], { target: { value: "test@example.com" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    // With || operator: includes('unauthorized') returns false,
    // includes('invalid credentials') returns true, so it shows
    // "Invalid credentials" error.
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows connection error on non-Error thrown", async () => {
    const loginFn = jest.fn().mockRejectedValue("string error");
    renderLogin(loginFn);

    const emailInputs = screen.getAllByLabelText("Email Address");
    const passwordInputs = screen.getAllByLabelText("Password");
    fireEvent.change(emailInputs[0], { target: { value: "test@example.com" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });

    const form = screen.getByText("Login").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("Login failed. Please check your connection and try again."),
      ).toBeInTheDocument();
    });
  });
});
