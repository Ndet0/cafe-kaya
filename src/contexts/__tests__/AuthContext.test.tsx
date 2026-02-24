import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../AuthContext";

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="user">{user ? user.email : "null"}</p>
      <button onClick={() => login("admin@cafekaya.com", "password")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderAuth(token: string | null = null) {
  if (token) localStorage.setItem("kaya_token", token);
  else localStorage.removeItem("kaya_token");

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with loading true when token exists", () => {
    renderAuth("mock-jwt-token");
    expect(screen.getByTestId("loading").textContent).toBe("true");
  });

  it("resolves user from token on mount", async () => {
    renderAuth("mock-jwt-token");
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("admin@cafekaya.com");
    });
  });

  it("sets user to null when no token", async () => {
    renderAuth(null);
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("logs in and sets user", async () => {
    const { user } = renderAuth(null);
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    await user.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("admin@cafekaya.com");
    });
    expect(localStorage.getItem("kaya_token")).toBe("mock-jwt-token");
  });

  it("logs out and clears user", async () => {
    const { user } = renderAuth("mock-jwt-token");
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("admin@cafekaya.com");
    });
    await user.click(screen.getByText("Logout"));
    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(localStorage.getItem("kaya_token")).toBeNull();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(
        <MemoryRouter>
          <TestConsumer />
        </MemoryRouter>,
      );
    }).toThrow("useAuth must be used within AuthProvider");
    spy.mockRestore();
  });

  it("clears user on invalid token", async () => {
    renderAuth("invalid-token");
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(localStorage.getItem("kaya_token")).toBeNull();
  });
});
