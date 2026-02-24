import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminOverview from "../AdminOverview";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminOverview />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminOverview", () => {
  it("renders stat cards", async () => {
    renderPage();
    expect(screen.getByText("Total menu items")).toBeInTheDocument();
    expect(screen.getByText("Published gallery photos")).toBeInTheDocument();
    expect(screen.getByText("New contact messages")).toBeInTheDocument();
    expect(screen.getByText("Pending review moderation")).toBeInTheDocument();
  });

  it("shows menu item count from API", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders recent messages section", () => {
    renderPage();
    expect(screen.getByText("Recent messages")).toBeInTheDocument();
  });

  it("renders recent activity section", () => {
    renderPage();
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
  });

  it("renders quick actions section", () => {
    renderPage();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
  });

  it("loads recent messages from API", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Reservation")).toBeInTheDocument();
    });
  });

  it("shows recent activity from messages", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/New contact from Jane/)).toBeInTheDocument();
    });
  });

  it("shows gallery count from API", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows new messages badge", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });
});
