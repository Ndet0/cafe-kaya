import { vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import * as api from "@/lib/api";
import { toast } from "sonner";
import LocationSection from "../LocationSection";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("LocationSection", () => {
  it("renders the section heading", () => {
    render(<LocationSection />);
    expect(screen.getByText("Visit Cafe Kaya")).toBeInTheDocument();
  });

  it("renders the address", () => {
    render(<LocationSection />);
    expect(screen.getByText(/Slip Road Off Waiyaki Way/)).toBeInTheDocument();
  });

  it("renders the phone number from settings", async () => {
    render(<LocationSection />);
    await waitFor(() => {
      expect(screen.getByText("+254710767717")).toBeInTheDocument();
    });
  });

  it("renders opening hours from settings", async () => {
    render(<LocationSection />);
    await waitFor(() => {
      expect(screen.getByText("Mon-Sat 9-10, Sun 9-9:30")).toBeInTheDocument();
    });
  });

  it("falls back to default contact details when settings are empty", async () => {
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/test/mocks/server");
    server.use(
      http.get("/api/settings/contact", () =>
        HttpResponse.json({
          address: "",
          phone: " ",
          hours: null,
          map_embed_url: "http://insecure.example/map",
          instagram_url: "",
          facebook_url: null,
          twitter_url: null,
        }),
      ),
    );
    render(<LocationSection />);
    await waitFor(() => {
      expect(screen.getByText("+254 710 767717")).toBeInTheDocument();
    });
    expect(screen.getByText(/Sunday: 9:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Monday – Saturday/)).toBeInTheDocument();
    expect(screen.getByTitle("Cafe Kaya Location")).toHaveAttribute(
      "src",
      expect.stringContaining("google.com/maps/embed"),
    );
  });

  it("renders Get Directions link", () => {
    render(<LocationSection />);
    expect(screen.getByText("Get Directions")).toBeInTheDocument();
  });

  it("renders Call Now link", () => {
    render(<LocationSection />);
    expect(screen.getByText("Call Now")).toBeInTheDocument();
  });

  it("renders contact form", () => {
    render(<LocationSection />);
    expect(screen.getByText("Send us a message")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByText("Send message")).toBeInTheDocument();
  });

  it("renders the map iframe", () => {
    render(<LocationSection />);
    expect(screen.getByTitle("Cafe Kaya Location")).toBeInTheDocument();
  });

  it("submits contact form successfully", async () => {
    const { user } = render(<LocationSection />);
    await user.type(screen.getByLabelText("Name"), "Jo");
    await user.type(screen.getByLabelText("Email"), "j@e.co");
    await user.type(screen.getByLabelText("Message"), "Hi");
    await user.click(screen.getByText("Send message"));
    await waitFor(() => {
      expect(screen.getByText("Send message")).toBeInTheDocument();
    });
  });

  it("shows validation errors for empty fields", async () => {
    const { user } = render(<LocationSection />);
    await user.click(screen.getByText("Send message"));
    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });

  it("handles contact form submission error", async () => {
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/test/mocks/server");
    server.use(
      http.post("/api/contact", () =>
        HttpResponse.json({ detail: "Server error" }, { status: 500 }),
      ),
    );
    const { user } = render(<LocationSection />);
    await user.type(screen.getByLabelText("Name"), "Jo");
    await user.type(screen.getByLabelText("Email"), "j@e.co");
    await user.type(screen.getByLabelText("Message"), "Hi");
    await user.click(screen.getByText("Send message"));
    await waitFor(() => {
      expect(screen.getByText("Send message")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when submitContact throws Error with empty message", async () => {
    vi.spyOn(api, "submitContact").mockRejectedValueOnce(new Error(""));
    const { user } = render(<LocationSection />);
    await user.type(screen.getByLabelText("Name"), "Jo");
    await user.type(screen.getByLabelText("Email"), "j@e.co");
    await user.type(screen.getByLabelText("Message"), "Hi");
    await user.click(screen.getByText("Send message"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to send message.");
    });
  });
});
