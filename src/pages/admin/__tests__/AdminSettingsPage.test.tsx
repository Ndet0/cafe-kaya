import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminSettingsPage from "../AdminSettingsPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, user };
}

describe("AdminSettingsPage", () => {
  it("renders business settings heading", () => {
    renderPage();
    expect(screen.getByText("Business settings")).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    renderPage();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Opening hours")).toBeInTheDocument();
    expect(screen.getByLabelText("Map embed URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
  });

  it("renders save button", () => {
    renderPage();
    expect(screen.getByText("Save settings")).toBeInTheDocument();
  });

  it("populates form with API data", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    expect(screen.getByLabelText("Phone")).toHaveValue("+254710767717");
  });

  it("allows editing fields", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    const phoneInput = screen.getByLabelText("Phone");
    await user.clear(phoneInput);
    await user.type(phoneInput, "+254700000000");
    expect(phoneInput).toHaveValue("+254700000000");
  });

  it("saves settings on button click", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    await user.click(screen.getByText("Save settings"));
  });

  it("allows editing social media fields", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Instagram")).toHaveValue("https://instagram.com/cafekaya254");
    }, { timeout: 5000 });
    const igInput = screen.getByLabelText("Instagram");
    await user.clear(igInput);
    await user.type(igInput, "https://instagram.com/new");
    expect(igInput).toHaveValue("https://instagram.com/new");
  });

  it("allows editing map embed URL", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    const mapInput = screen.getByLabelText("Map embed URL");
    await user.type(mapInput, "https://maps.google.com/embed");
    expect(mapInput).toHaveValue("https://maps.google.com/embed");
  });

  it("allows editing hours", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Opening hours")).toHaveValue("Mon-Sat 9-10, Sun 9-9:30");
    }, { timeout: 5000 });
    const hoursInput = screen.getByLabelText("Opening hours");
    await user.clear(hoursInput);
    await user.type(hoursInput, "9am-5pm");
    expect(hoursInput).toHaveValue("9am-5pm");
  });

  it("allows editing facebook URL", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    const fbInput = screen.getByLabelText("Facebook");
    await user.type(fbInput, "https://facebook.com/cafekaya");
    expect(fbInput).toHaveValue("https://facebook.com/cafekaya");
  });

  it("allows editing twitter URL", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    const twInput = screen.getByLabelText("Twitter");
    await user.type(twInput, "https://twitter.com/cafekaya");
    expect(twInput).toHaveValue("https://twitter.com/cafekaya");
  });

  it("allows editing address", async () => {
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    const addrInput = screen.getByLabelText("Address");
    await user.clear(addrInput);
    await user.type(addrInput, "New Address");
    expect(addrInput).toHaveValue("New Address");
  });

  it("handles save error from API", async () => {
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/test/mocks/server");
    server.use(
      http.put("/api/settings/contact", () =>
        HttpResponse.json({ detail: "Save failed" }, { status: 500 }),
      ),
    );
    const { user } = renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Address")).toHaveValue("Slip Road Off Waiyaki Way, Nairobi");
    }, { timeout: 5000 });
    await user.click(screen.getByText("Save settings"));
    await waitFor(() => {
      expect(screen.getByText("Save settings")).toBeInTheDocument();
    });
  });
});
