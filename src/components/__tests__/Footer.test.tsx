import { render, screen } from "@/test/test-utils";
import Footer from "../Footer";

describe("Footer", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  it("renders the brand name", () => {
    expect(screen.getByText("Cafe Kaya")).toBeInTheDocument();
  });

  it("renders quick links section", () => {
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
    const nav = document.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("renders contact information", () => {
    expect(screen.getByText("+254 710 767717")).toBeInTheDocument();
    expect(screen.getByText(/Slip Road Off Waiyaki Way/)).toBeInTheDocument();
  });

  it("renders opening hours", () => {
    expect(screen.getByText(/Sun: 9:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Mon–Sat: 9:00 AM/)).toBeInTheDocument();
  });

  it("renders the current year copyright", () => {
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders social media links", () => {
    expect(document.querySelectorAll('a[href*="instagram"]').length).toBeGreaterThanOrEqual(1);
  });
});
