import { render, screen } from "@/test/test-utils";
import NotFound from "../NotFound";

describe("NotFound", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 404 heading", () => {
    render(<NotFound />, { route: "/nonexistent" });
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders the error message", () => {
    render(<NotFound />, { route: "/nonexistent" });
    expect(screen.getByText("Oops! Page not found")).toBeInTheDocument();
  });

  it("renders return home link", () => {
    render(<NotFound />, { route: "/nonexistent" });
    const link = screen.getByText("Return to Home");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("logs the missing route", () => {
    render(<NotFound />, { route: "/nonexistent" });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("404"),
      "/nonexistent",
    );
  });
});
