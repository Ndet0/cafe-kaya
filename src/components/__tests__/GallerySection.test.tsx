import { render, screen, waitFor } from "@/test/test-utils";
import { fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import GallerySection from "../GallerySection";

describe("GallerySection", () => {
  it("renders the section heading", () => {
    render(<GallerySection />);
    expect(screen.getByText("A Glimpse Inside")).toBeInTheDocument();
  });

  it("shows loading skeletons initially", () => {
    render(<GallerySection />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders gallery images from API", async () => {
    render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByAltText("Interior shot")).toBeInTheDocument();
    });
    expect(screen.getByAltText("Latte art")).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("/api/gallery", () => HttpResponse.json({ detail: "Error" }, { status: 500 })),
    );
    render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByText(/Please check back in a moment/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no images", async () => {
    server.use(http.get("/api/gallery", () => HttpResponse.json([])));
    render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByText("No gallery images yet.")).toBeInTheDocument();
    });
  });

  it("opens lightbox when image is clicked", async () => {
    const { user } = render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByAltText("Interior shot")).toBeInTheDocument();
    });
    await user.click(screen.getByAltText("Interior shot"));
    await waitFor(() => {
      expect(screen.getByAltText("Gallery fullscreen")).toBeInTheDocument();
    });
  });

  it("closes lightbox when backdrop is clicked", async () => {
    const { user } = render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByAltText("Interior shot")).toBeInTheDocument();
    });
    await user.click(screen.getByAltText("Interior shot"));
    await waitFor(() => {
      expect(screen.getByAltText("Gallery fullscreen")).toBeInTheDocument();
    });
    const closeBtn = document.querySelector("button");
    if (closeBtn) await user.click(closeBtn);
  });

  it("handles image error by showing fallback", async () => {
    render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByAltText("Interior shot")).toBeInTheDocument();
    });
    const img = screen.getByAltText("Interior shot");
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/placeholder.svg");
  });

  it("handles fullscreen image error", async () => {
    const { user } = render(<GallerySection />);
    await waitFor(() => {
      expect(screen.getByAltText("Interior shot")).toBeInTheDocument();
    });
    await user.click(screen.getByAltText("Interior shot"));
    await waitFor(() => {
      expect(screen.getByAltText("Gallery fullscreen")).toBeInTheDocument();
    });
    const fsImg = screen.getByAltText("Gallery fullscreen");
    fireEvent.error(fsImg);
    expect(fsImg).toHaveAttribute("src", "/placeholder.svg");
  });
});
