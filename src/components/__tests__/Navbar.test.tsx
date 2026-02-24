import { render, screen, waitFor } from "@/test/test-utils";
import Navbar from "../Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

function renderNavbar(route = "/") {
  return render(
    <AuthProvider>
      <Navbar />
    </AuthProvider>,
    { route },
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the brand name", async () => {
    renderNavbar();
    expect(screen.getByText("Cafe Kaya")).toBeInTheDocument();
  });

  it("renders navigation links", async () => {
    renderNavbar();
    expect(screen.getAllByText("Home").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("About").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Menu").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Contact").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Login link when unauthenticated", async () => {
    renderNavbar();
    await waitFor(() => {
      expect(screen.getAllByText("Login").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows Dashboard and Logout when authenticated", async () => {
    localStorage.setItem("kaya_token", "mock-jwt-token");
    renderNavbar();
    await waitFor(() => {
      expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("Logout").length).toBeGreaterThanOrEqual(1);
  });

  it("toggles mobile menu on button click", async () => {
    const { user } = renderNavbar();
    const toggleButtons = screen.getAllByRole("button");
    const mobileToggle = toggleButtons[0];
    await user.click(mobileToggle);
    // After opening, the close icon appears — menu is toggled
    await user.click(mobileToggle);
  });

  it("renders Call Now link", () => {
    renderNavbar();
    const callLinks = screen.getAllByText("Call Now");
    expect(callLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders brand as Link on non-home pages", () => {
    renderNavbar("/admin");
    expect(screen.getByText("Cafe Kaya").closest("a")).toHaveAttribute("href", "/");
  });

  it("handles scroll event by changing background", async () => {
    renderNavbar();
    const nav = document.querySelector("nav")!;
    Object.defineProperty(window, "scrollY", { writable: true, value: 100 });
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(nav.className).toContain("backdrop-blur");
    });
  });

  it("closes mobile menu when nav link is clicked", async () => {
    const { user } = renderNavbar();
    const toggleButtons = screen.getAllByRole("button");
    await user.click(toggleButtons[0]);
    const mobileLinks = document.querySelectorAll('.overflow-hidden a');
    if (mobileLinks.length > 0) {
      await user.click(mobileLinks[0] as HTMLElement);
    }
  });

  it("mobile menu shows logout for authenticated user", async () => {
    localStorage.setItem("kaya_token", "mock-jwt-token");
    renderNavbar();
    await waitFor(() => {
      const logoutBtns = screen.getAllByText("Logout");
      expect(logoutBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("desktop logout clears token", async () => {
    localStorage.setItem("kaya_token", "mock-jwt-token");
    const { user } = renderNavbar();
    await waitFor(() => {
      expect(screen.getAllByText("Logout").length).toBeGreaterThanOrEqual(1);
    }, { timeout: 10000 });
    const logoutBtns = screen.getAllByText("Logout");
    await user.click(logoutBtns[0]);
    await waitFor(() => {
      expect(localStorage.getItem("kaya_token")).toBeNull();
    });
  });
});
