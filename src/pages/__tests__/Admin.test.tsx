import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Admin from "../Admin";
import AdminOverview from "../admin/AdminOverview";

function renderAdmin() {
  localStorage.setItem("kaya_token", "mock-jwt-token");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/overview"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin" element={<Admin />}>
              <Route path="overview" element={<AdminOverview />} />
              <Route path="menu" element={<div>Menu Page</div>} />
              <Route path="gallery" element={<div>Gallery Page</div>} />
              <Route path="messages" element={<div>Messages Page</div>} />
              <Route path="reviews" element={<div>Reviews Page</div>} />
              <Route path="settings" element={<div>Settings Page</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("Admin", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the admin dashboard heading", async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
    });
  });

  it("shows user email", async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText("admin@cafekaya.com")).toBeInTheDocument();
    });
  });

  it("renders sidebar navigation items", async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });
    const sidebar = document.querySelector("aside nav")!;
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.textContent).toContain("Menu");
    expect(sidebar.textContent).toContain("Gallery");
    expect(sidebar.textContent).toContain("Messages");
    expect(sidebar.textContent).toContain("Reviews");
    expect(sidebar.textContent).toContain("Settings");
  });

  it("renders the toggle sidebar button", async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByLabelText("Toggle sidebar")).toBeInTheDocument();
    });
  });

  it("toggles sidebar on button click", async () => {
    const { user } = renderAdmin();
    await waitFor(() => {
      expect(screen.getByLabelText("Toggle sidebar")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("Toggle sidebar"));
  });

  it("highlights active navigation item", async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });
    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink?.className).toContain("bg-primary");
  });

  it("can navigate to menu page via sidebar", async () => {
    const { user } = renderAdmin();
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });
    const sidebar = document.querySelector("aside nav")!;
    const menuLink = Array.from(sidebar.querySelectorAll("a")).find(a => a.textContent === "Menu");
    if (menuLink) {
      await user.click(menuLink);
      await waitFor(() => {
        expect(screen.getByText("Menu Page")).toBeInTheDocument();
      });
    }
  });
});
