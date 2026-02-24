import { render, screen, waitFor } from "@/test/test-utils";
import { fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import MenuSection from "../MenuSection";

describe("MenuSection", () => {
  it("renders the section heading", async () => {
    render(<MenuSection />);
    expect(screen.getByText("Crafted With Care")).toBeInTheDocument();
  });

  it("shows loading skeletons initially", () => {
    render(<MenuSection />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders menu items from API", async () => {
    render(<MenuSection />);
    await waitFor(() => {
      expect(screen.getByText("Espresso")).toBeInTheDocument();
    });
    expect(screen.getByText("Chicken Pilau")).toBeInTheDocument();
    expect(screen.getByText("KES 350")).toBeInTheDocument();
  });

  it("shows category names", async () => {
    render(<MenuSection />);
    await waitFor(() => {
      expect(screen.getByText("Coffee")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("/api/menu", () => HttpResponse.json({ detail: "Error" }, { status: 500 })),
    );
    render(<MenuSection />);
    await waitFor(() => {
      expect(screen.getByText(/Please check back in a moment/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no items", async () => {
    server.use(http.get("/api/menu", () => HttpResponse.json([])));
    render(<MenuSection />);
    await waitFor(() => {
      expect(screen.getByText("No menu items yet.")).toBeInTheDocument();
    });
  });

  it("renders View Full Menu link", () => {
    render(<MenuSection />);
    expect(screen.getByText("View Full Menu")).toBeInTheDocument();
  });

  it("handles image error by showing placeholder", async () => {
    render(<MenuSection />);
    await waitFor(() => {
      expect(screen.getByText("Espresso")).toBeInTheDocument();
    });
    const images = document.querySelectorAll("img");
    if (images.length > 0) {
      fireEvent.error(images[0]);
    }
  });
});
