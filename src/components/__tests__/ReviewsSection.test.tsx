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
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });
    expect(screen.getByText(/from 42 reviews/)).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("/api/reviews", () => HttpResponse.json({ detail: "Error" }, { status: 500 })),
    );
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText(/Please check back in a moment/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no reviews", async () => {
    server.use(http.get("/api/reviews", () => HttpResponse.json([])));
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
    });
  });

  it("handles zero rating correctly", async () => {
    server.use(
      http.get("/api/reviews/rating", () => HttpResponse.json({ average: 0, count: 0 })),
    );
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  it("renders half star for non-integer ratings", async () => {
    server.use(
      http.get("/api/reviews/rating", () => HttpResponse.json({ average: 3.7, count: 10 })),
    );
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText("3.7")).toBeInTheDocument();
    });
  });

  it("renders correct count text", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText(/from 42 reviews/)).toBeInTheDocument();
    });
  });
});
