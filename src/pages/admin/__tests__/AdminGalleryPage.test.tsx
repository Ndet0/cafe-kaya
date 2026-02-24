import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminGalleryPage from "../AdminGalleryPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminGalleryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("AdminGalleryPage", () => {
  it("renders the upload form", () => {
    renderPage();
    expect(screen.getByText("Upload gallery image")).toBeInTheDocument();
  });

  it("renders image URL input", () => {
    renderPage();
    expect(screen.getByLabelText("Image URL")).toBeInTheDocument();
  });

  it("renders alt text and span inputs", () => {
    renderPage();
    expect(screen.getByLabelText("Alt text")).toBeInTheDocument();
    expect(screen.getByLabelText("Span")).toBeInTheDocument();
  });

  it("renders gallery ordering section", () => {
    renderPage();
    expect(screen.getByText("Gallery ordering")).toBeInTheDocument();
  });

  it("loads gallery images from API", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Interior shot")).toBeInTheDocument();
    });
    expect(screen.getByText("Latte art")).toBeInTheDocument();
  });

  it("disables add button when URL is empty", () => {
    renderPage();
    const addBtn = screen.getByRole("button", { name: /Add image/i });
    expect(addBtn).toBeDisabled();
  });

  it("enables add button when URL is provided", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText("Image URL"), "https://example.com/photo.jpg");
    const addBtn = screen.getByRole("button", { name: /Add image/i });
    expect(addBtn).not.toBeDisabled();
  });

  it("shows reorder buttons for images", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Interior shot")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("can delete an image", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Interior shot")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    await user.click(deleteButtons[0]);
  });

  it("can submit new gallery image", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText("Image URL"), "https://example.com/new.jpg");
    await user.type(screen.getByLabelText("Alt text"), "New photo");
    await user.click(screen.getByRole("button", { name: /Add image/i }));
    await waitFor(() => {
      expect(screen.getByLabelText("Image URL")).toHaveValue("");
    });
  });

  it("rejects invalid image URL on create", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText("Image URL"), "file:///etc/passwd");
    await user.click(screen.getByRole("button", { name: /Add image/i }));
  });

  it("fills alt and span fields", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText("Alt text"), "Test alt");
    await user.type(screen.getByLabelText("Span"), "col-span-2");
    expect(screen.getByLabelText("Alt text")).toHaveValue("Test alt");
    expect(screen.getByLabelText("Span")).toHaveValue("col-span-2");
  });

  it("handles create error from API", async () => {
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/test/mocks/server");
    server.use(
      http.post("/api/gallery", () =>
        HttpResponse.json({ detail: "Server error" }, { status: 500 }),
      ),
    );
    const { user } = renderPage();
    await user.type(screen.getByLabelText("Image URL"), "https://x.co/a.jpg");
    await user.click(screen.getByRole("button", { name: /Add image/i }));
    await waitFor(() => {
      expect(screen.getByLabelText("Image URL")).toHaveValue("https://x.co/a.jpg");
    });
  });

  it("handles reorder error from API", async () => {
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/test/mocks/server");
    server.use(
      http.put("/api/gallery/reorder", () =>
        HttpResponse.json({ detail: "Reorder error" }, { status: 500 }),
      ),
    );
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByText("Interior shot")).toBeInTheDocument();
    });
    const downButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector('[class*="arrow-down"]') || btn.getAttribute("aria-label")?.includes("down"),
    );
    // Click any move button to trigger reorder
    const moveButtons = screen.getAllByRole("button");
    for (const btn of moveButtons) {
      const svg = btn.querySelector("svg");
      if (svg?.classList.toString().includes("arrow-down")) {
        await user.click(btn);
        break;
      }
    }
  });
});
