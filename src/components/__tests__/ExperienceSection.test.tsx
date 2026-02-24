import { render, screen } from "@/test/test-utils";
import ExperienceSection from "../ExperienceSection";

describe("ExperienceSection", () => {
  beforeEach(() => {
    render(<ExperienceSection />);
  });

  it("renders the section heading", () => {
    expect(screen.getByText("Not Just Coffee")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    expect(screen.getByText("The Experience")).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    expect(screen.getByText("Art-Filled Space")).toBeInTheDocument();
    expect(screen.getByText("Games & Books")).toBeInTheDocument();
    expect(screen.getByText("Relaxing Vibe")).toBeInTheDocument();
    expect(screen.getByText("Freelancer Friendly")).toBeInTheDocument();
    expect(screen.getByText("Family Welcome")).toBeInTheDocument();
    expect(screen.getByText("Sustainable")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    expect(screen.getByText(/Rotating exhibitions/)).toBeInTheDocument();
    expect(screen.getByText(/Free Wi-Fi/)).toBeInTheDocument();
  });
});
