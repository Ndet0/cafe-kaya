import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders without crashing", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText("Cafe Kaya").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders the home page by default", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Westlands, Nairobi")).toBeInTheDocument();
    });
  });
});
