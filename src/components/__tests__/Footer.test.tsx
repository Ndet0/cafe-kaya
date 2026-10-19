import { render, screen, waitFor } from "@/test/test-utils";
import Footer from "../Footer";

describe("Footer", () => {
  it("renders the brand name", () => {
    render(<Footer />);
    expect(screen.getByText("Cafe Kaya")).toBeInTheDocument();
  });

  it("renders quick links section", () => {
    render(<Footer />);
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
    const nav = document.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("renders contact information from settings", async () => {
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByText("+254710767717")).toBeInTheDocument();
    });
    expect(screen.getByText(/Slip Road Off Waiyaki Way/)).toBeInTheDocument();
  });

  it("renders opening hours from settings", async () => {
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByText("Mon-Sat 9-10, Sun 9-9:30")).toBeInTheDocument();
    });
  });

  it("falls back to default contact details when settings are empty", async () => {
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/test/mocks/server");
    server.use(
      http.get("/api/settings/contact", () =>
        HttpResponse.json({
          address: null,
          phone: "",
          hours: null,
          map_embed_url: null,
          instagram_url: null,
          facebook_url: null,
          twitter_url: null,
        }),
      ),
    );
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByText("+254 710 767717")).toBeInTheDocument();
    });
    expect(screen.getByText(/Sunday: 9:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Monday – Saturday/)).toBeInTheDocument();
    expect(document.querySelector('a[href*="facebook"]')).toBeNull();
    expect(document.querySelector('a[href*="twitter"]')).toBeNull();
    expect(document.querySelector('a[href*="instagram"]')).toBeTruthy();
  });

  it("renders the current year copyright", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders social media links", () => {
    render(<Footer />);
    expect(document.querySelectorAll('a[href*="instagram"]').length).toBeGreaterThanOrEqual(1);
  });
});
