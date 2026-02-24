import { render, screen } from "@/test/test-utils";
import AboutSection from "../AboutSection";

describe("AboutSection", () => {
  beforeEach(() => {
    render(<AboutSection />);
  });

  it("renders the section heading", () => {
    expect(screen.getByText(/More Than a Café/)).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    expect(screen.getByText("Our Story")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    expect(screen.getByText(/Nestled in the heart of Westlands/)).toBeInTheDocument();
  });

  it("renders all four values", () => {
    expect(screen.getByText("Eco-Friendly")).toBeInTheDocument();
    expect(screen.getByText("Art-Inspired")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Welcoming")).toBeInTheDocument();
  });

  it("renders the about image", () => {
    expect(screen.getByAltText("Inside Cafe Kaya")).toBeInTheDocument();
  });
});
