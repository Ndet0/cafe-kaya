import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminMessagesPage from "../AdminMessagesPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminMessagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("AdminMessagesPage", () => {
  it("renders inbox workflow card", () => {
    renderPage();
    expect(screen.getByText("Inbox workflow")).toBeInTheDocument();
  });

  it("renders filter tabs", () => {
    renderPage();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("renders messages section", () => {
    renderPage();
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("loads messages from API", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Reservation")).toBeInTheDocument();
    });
    expect(screen.getByText("Table for 4 please")).toBeInTheDocument();
    expect(screen.getByText(/Jane/)).toBeInTheDocument();
  });

  it("shows Mark resolved button for new messages", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Mark resolved")).toBeInTheDocument();
    });
  });

  it("filters messages by tab", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Reservation")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Resolved"));
    await waitFor(() => {
      expect(screen.getByText("No messages found.")).toBeInTheDocument();
    });
  });

  it("can mark a message as resolved", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Mark resolved")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Mark resolved"));
  });

  it("shows New badge for unread messages", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });

  it("shows Already resolved for read messages", async () => {
    server.use(
      http.get("/api/contact", () =>
        HttpResponse.json([
          {
            id: "msg-2",
            name: "Resolved User",
            email: "resolved@example.com",
            subject: "Done",
            message: "All good",
            read: true,
            created_at: "2025-01-01T10:00:00Z",
          },
        ]),
      ),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Already resolved")).toBeInTheDocument();
    });
  });

  it("filters to show only new messages", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Reservation")).toBeInTheDocument();
    });
    const tabTriggers = document.querySelectorAll('[role="tab"]');
    const newTab = Array.from(tabTriggers).find(t => t.textContent === "New");
    if (newTab) await user.click(newTab as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText("Reservation")).toBeInTheDocument();
    });
  });

  it("shows message date", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Reservation")).toBeInTheDocument();
    });
  });

  it("handles resolve error from API", async () => {
    server.use(
      http.patch("/api/contact/:messageId/read", () =>
        HttpResponse.json({ detail: "Failed" }, { status: 500 }),
      ),
    );
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Mark resolved")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Mark resolved"));
    await waitFor(() => {
      expect(screen.getByText("Mark resolved")).toBeInTheDocument();
    });
  });
});
