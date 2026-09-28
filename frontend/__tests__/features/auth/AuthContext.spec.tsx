import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/features/auth/contexts/AuthContext";
import { authApi } from "@/features/auth/services/authApi";

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

const AuthConsumer = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.username ?? "none"}</span>
      <button onClick={() => login("testuser", "testpass")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
};

const DefaultAuthConsumer = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  const [loginResult, setLoginResult] = React.useState<string>("");
  return (
    <div>
      <span data-testid="default-auth">{String(isAuthenticated)}</span>
      <span data-testid="default-loading">{String(loading)}</span>
      <span data-testid="default-user">{user?.username ?? "none"}</span>
      <button
        onClick={async () => {
          const result = await login("test", "pass");
          setLoginResult(String(result));
        }}
      >
        default-login
      </button>
      <span data-testid="default-login-result">{loginResult}</span>
      <button onClick={() => logout()}>default-logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("starts with loading=true then becomes false", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("initializes authenticated when valid token in localStorage", async () => {
    const token = makeToken({ sub: "user1", preferred_username: "storeduser" });
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify({ id: "user1", username: "storeduser" }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("true");
      expect(screen.getByTestId("user").textContent).toBe("storeduser");
    });
  });

  it("clears invalid token from localStorage on init", async () => {
    localStorage.setItem("authToken", "invalid-token");
    localStorage.setItem("user", "{}");

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("false");
    });
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("handles corrupted user JSON in localStorage", async () => {
    const token = makeToken({ sub: "user1" });
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", "corrupted-json");

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("false");
    });
  });

  it("login succeeds with valid credentials", async () => {
    const token = makeToken({ sub: "user1", preferred_username: "testuser" });
    jest.spyOn(authApi, "login").mockResolvedValue({ message: "Success", token });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    fireEvent.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("true");
      expect(screen.getByTestId("user").textContent).toBe("testuser");
    });
  });

  it("login fails when no token returned", async () => {
    jest.spyOn(authApi, "login").mockResolvedValue({ message: "Success", token: "" });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    fireEvent.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("false");
    });
  });

  it("login fails when decodeToken returns null", async () => {
    jest.spyOn(authApi, "login").mockResolvedValue({ message: "Success", token: "invalid" });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    fireEvent.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("false");
    });
  });

  it("logout clears auth state", async () => {
    const token = makeToken({ sub: "user1", preferred_username: "testuser" });
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify({ id: "user1", username: "testuser" }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("true");
    });

    fireEvent.click(screen.getByText("logout"));
    await waitFor(() => {
      expect(screen.getByTestId("auth").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("none");
    });
    expect(localStorage.getItem("authToken")).toBeNull();
  });

  it("returns default context values when used outside AuthProvider", async () => {
    render(<DefaultAuthConsumer />);
    expect(screen.getByTestId("default-auth").textContent).toBe("false");
    expect(screen.getByTestId("default-loading").textContent).toBe("false");
    expect(screen.getByTestId("default-user").textContent).toBe("none");

    fireEvent.click(screen.getByText("default-login"));
    await waitFor(() => {
      expect(screen.getByTestId("default-login-result").textContent).toBe("false");
    });

    // Call default logout to cover the default logout function
    fireEvent.click(screen.getByText("default-logout"));
    expect(screen.getByTestId("default-auth").textContent).toBe("false");
  });
});
