import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "../Index";

function renderIndex() {
  localStorage.clear();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Index />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Index", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the hero section", () => {
    renderIndex();
    expect(screen.getByText("Westlands, Nairobi")).toBeInTheDocument();
  });

  it("renders the about section", () => {
    renderIndex();
    expect(screen.getByText("Our Story")).toBeInTheDocument();
  });

  it("renders the gallery section", () => {
    renderIndex();
    expect(screen.getByText("A Glimpse Inside")).toBeInTheDocument();
  });

  it("renders the menu section", () => {
    renderIndex();
    expect(screen.getByText("Crafted With Care")).toBeInTheDocument();
  });

  it("renders the experience section", () => {
    renderIndex();
    expect(screen.getByText("The Experience")).toBeInTheDocument();
  });

  it("renders the reviews section", () => {
    renderIndex();
    expect(screen.getByText("What Our Guests Say")).toBeInTheDocument();
  });

  it("renders the location section", () => {
    renderIndex();
    expect(screen.getByText("Visit Cafe Kaya")).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    renderIndex();
    expect(screen.getByText("Come Experience Cafe Kaya")).toBeInTheDocument();
  });

  it("renders the footer", () => {
    renderIndex();
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
  });
});
