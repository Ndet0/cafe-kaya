import { render, screen } from "@/test/test-utils";
import CTASection from "../CTASection";

describe("CTASection", () => {
  beforeEach(() => {
    render(<CTASection />);
  });

  it("renders the heading", () => {
    expect(screen.getByText("Come Experience Cafe Kaya")).toBeInTheDocument();
  });

  it("renders the description", () => {
    expect(screen.getByText(/Your table awaits/)).toBeInTheDocument();
  });

  it("renders Get Directions link", () => {
    expect(screen.getByText("Get Directions")).toBeInTheDocument();
  });

  it("renders Call Now link", () => {
    expect(screen.getByText("Call Now")).toBeInTheDocument();
  });

  it("renders View Menu link", () => {
    expect(screen.getByText("View Menu")).toBeInTheDocument();
  });

  it("has a background image", () => {
    expect(screen.getByAltText("Cafe Kaya outdoor")).toBeInTheDocument();
  });
});
