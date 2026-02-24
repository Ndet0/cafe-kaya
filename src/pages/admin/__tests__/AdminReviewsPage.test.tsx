import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminReviewsPage from "../AdminReviewsPage";

const mockPendingReviews = [
  { id: "rev-p1", name: "Pending Alice", text: "Not bad", rating: 3, created_at: "2025-02-01T10:00:00Z" },
];

function renderPage(withPending = false) {
  if (withPending) {
    server.use(
      http.get("/api/reviews/pending", () => HttpResponse.json(mockPendingReviews)),
    );
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminReviewsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("AdminReviewsPage", () => {
  it("renders pending moderation card", () => {
    renderPage();
    expect(screen.getByText("Pending moderation")).toBeInTheDocument();
  });

  it("renders published rating card", () => {
    renderPage();
    expect(screen.getByText("Published rating")).toBeInTheDocument();
  });

  it("renders pending reviews section", () => {
    renderPage();
    expect(screen.getByText("Pending reviews")).toBeInTheDocument();
  });

  it("shows rating from API", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("4.5 / 5")).toBeInTheDocument();
    });
    expect(screen.getByText(/42 approved review/)).toBeInTheDocument();
  });

  it("shows no pending reviews when empty", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("No pending reviews.")).toBeInTheDocument();
    });
  });

  it("shows pending count as 0", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("shows pending reviews when they exist", async () => {
    renderPage(true);
    await waitFor(() => {
      expect(screen.getByText("Pending Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("Not bad")).toBeInTheDocument();
  });

  it("can approve a pending review", async () => {
    const { user } = renderPage(true);
    await waitFor(() => {
      expect(screen.getByText("Pending Alice")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Approve/i }));
  });

  it("can reject a pending review", async () => {
    const { user } = renderPage(true);
    await waitFor(() => {
      expect(screen.getByText("Pending Alice")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Reject/i }));
  });

  it("handles review update error", async () => {
    server.use(
      http.patch("/api/reviews/:reviewId", () =>
        HttpResponse.json({ detail: "Update failed" }, { status: 500 }),
      ),
    );
    const { user } = renderPage(true);
    await waitFor(() => {
      expect(screen.getByText("Pending Alice")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Approve/i }));
    await waitFor(() => {
      expect(screen.getByText("Pending Alice")).toBeInTheDocument();
    });
  });
});
