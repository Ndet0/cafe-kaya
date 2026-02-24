import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "../ProtectedRoute";

function renderWithAuth(token: string | null) {
  if (token) {
    localStorage.setItem("kaya_token", token);
  } else {
    localStorage.removeItem("kaya_token");
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <div>Admin Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows loading spinner while auth is loading", () => {
    localStorage.setItem("kaya_token", "mock-jwt-token");
    renderWithAuth("mock-jwt-token");
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", async () => {
    renderWithAuth(null);
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("renders children when authenticated", async () => {
    renderWithAuth("mock-jwt-token");
    await waitFor(() => {
      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });
  });
});
