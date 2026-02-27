import { render, screen, waitFor } from "@/test/test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import ReviewsSection from "../ReviewsSection";

describe("ReviewsSection", () => {
  it("renders the section heading", () => {
    render(<ReviewsSection />);
    expect(screen.getByText("What Our Guests Say")).toBeInTheDocument();
  });

  it("shows loading skeletons initially", () => {
    render(<ReviewsSection />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders reviews from API", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders review text", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText(/Amazing coffee!/)).toBeInTheDocument();
    });
  });

  it("renders average rating", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("4.7")).toBeInTheDocument();
    });
    expect(screen.getByText(/from 120 reviews/)).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("/api/reviews", () => HttpResponse.json({ detail: "Error" }, { status: 500 })),
    );
    render(<ReviewsSection />);
    await waitFor(
      () => {
        expect(screen.getByText(/Please check back in a moment/)).toBeInTheDocument();
      },
      { timeout: 8000 },
    );
  });

  it("shows empty state when no reviews", async () => {
    server.use(
      http.get("/api/reviews", () =>
        HttpResponse.json({ rating: 0, total_reviews: 0, reviews: [] }),
      ),
    );
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
    });
  });

  it("handles zero rating correctly", async () => {
    server.use(
      http.get("/api/reviews", () =>
        HttpResponse.json({ rating: 0, total_reviews: 0, reviews: [] }),
      ),
    );
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  it("renders half star for non-integer ratings", async () => {
    server.use(
      http.get("/api/reviews", () =>
        HttpResponse.json({
          rating: 3.7,
          total_reviews: 10,
          reviews: [
            { id: "r1", name: "User", text: "Good", rating: 4, created_at: null },
          ],
        }),
      ),
    );
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("3.7")).toBeInTheDocument();
    });
  });

  it("renders correct count text", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText(/from 120 reviews/)).toBeInTheDocument();
    });
  });

  it("shows Google badge for Google reviews", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Google").length).toBeGreaterThan(0);
  });
});
