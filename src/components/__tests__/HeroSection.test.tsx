import { render, screen } from "@/test/test-utils";
import HeroSection from "../HeroSection";

describe("HeroSection", () => {
  beforeEach(() => {
    render(<HeroSection />);
  });

  it("renders the main heading", () => {
    expect(screen.getByText("Cafe Kaya")).toBeInTheDocument();
  });

  it("renders the location text", () => {
    expect(screen.getByText("Westlands, Nairobi")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    expect(screen.getByText(/Organic Coffee/)).toBeInTheDocument();
  });

  it("renders View Menu CTA", () => {
    expect(screen.getByText("View Menu")).toBeInTheDocument();
  });

  it("renders Get Directions CTA", () => {
    expect(screen.getByText("Get Directions")).toBeInTheDocument();
  });

  it("has a hero background image", () => {
    const img = screen.getByAltText("Cafe Kaya interior");
    expect(img).toBeInTheDocument();
  });
});
