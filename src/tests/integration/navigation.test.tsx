import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import AdminOverview from "@/pages/admin/AdminOverview";

function renderApp(initialRoute = "/", token: string | null = null) {
  localStorage.clear();
  if (token) localStorage.setItem("kaya_token", token);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("Navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders home page at /", () => {
    renderApp("/");
    expect(screen.getByText("Westlands, Nairobi")).toBeInTheDocument();
  });

  it("renders Reviews section", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByText("What Our Guests Say")).toBeInTheDocument();
    });
  });

  it("shows Google badge when reviews include Google source", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Google").length).toBeGreaterThan(0);
  });

  it("renders login page at /login", async () => {
    renderApp("/login");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    });
  });

  it("renders 404 for unknown routes", () => {
    renderApp("/unknown-page");
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("redirects unauthenticated /admin to login", async () => {
    renderApp("/admin");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    });
  });

  it("shows admin for authenticated users", async () => {
    renderApp("/admin/overview", "mock-jwt-token");
    await waitFor(() => {
      expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
    });
  });
});
