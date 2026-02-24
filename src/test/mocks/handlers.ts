import { http, HttpResponse } from "msw";

export const mockUser = {
  id: "user-1",
  email: "admin@cafekaya.com",
  role: "admin",
};

export const mockToken = {
  access_token: "mock-jwt-token",
  token_type: "bearer",
};

export const mockCategories = [
  { id: "cat-1", name: "Coffee", sort_order: 0 },
  { id: "cat-2", name: "Food", sort_order: 1 },
];

export const mockMenuItems = [
  {
    id: "item-1",
    name: "Espresso",
    description: "Rich and bold",
    price: "350",
    category_id: "cat-1",
    category_name: "Coffee",
    image_url: "/espresso.jpg",
    sort_order: 0,
    is_available: true,
  },
  {
    id: "item-2",
    name: "Chicken Pilau",
    description: "Fragrant spiced rice",
    price: "850",
    category_id: "cat-2",
    category_name: "Food",
    image_url: null,
    sort_order: 0,
    is_available: true,
  },
];

export const mockGalleryImages = [
  { id: "img-1", image_url: "https://example.com/photo1.jpg", alt: "Interior shot", span: "", sort_order: 0 },
  { id: "img-2", image_url: "https://example.com/photo2.jpg", alt: "Latte art", span: "col-span-2", sort_order: 1 },
];

export const mockReviews = [
  { id: "rev-1", name: "Alice", text: "Amazing coffee!", rating: 5, created_at: "2025-01-15T10:00:00Z" },
  { id: "rev-2", name: "Bob", text: "Great atmosphere", rating: 4, created_at: "2025-01-10T08:00:00Z" },
];

export const mockRating = { average: 4.5, count: 42 };

export const mockContactMessages = [
  {
    id: "msg-1",
    name: "Jane",
    email: "jane@example.com",
    subject: "Reservation",
    message: "Table for 4 please",
    read: false,
    created_at: "2025-02-01T12:00:00Z",
  },
];

export const mockContactSettings = {
  address: "Slip Road Off Waiyaki Way, Nairobi",
  phone: "+254710767717",
  hours: "Mon-Sat 9-10, Sun 9-9:30",
  map_embed_url: null,
  instagram_url: "https://instagram.com/cafekaya254",
  facebook_url: null,
  twitter_url: null,
};

export const handlers = [
  // Auth
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "admin@cafekaya.com" && body.password === "password") {
      return HttpResponse.json(mockToken);
    }
    return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }),

  http.get("/api/auth/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth === "Bearer mock-jwt-token") {
      return HttpResponse.json(mockUser);
    }
    return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }),

  // Upload
  http.post("/api/upload", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth !== "Bearer mock-jwt-token") {
      return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }
    return HttpResponse.json({ url: "https://example.com/uploaded.jpg" });
  }),

  // Menu
  http.get("/api/menu/categories", () => HttpResponse.json(mockCategories)),

  http.get("/api/menu", () => HttpResponse.json(mockMenuItems)),

  http.post("/api/menu/categories", async ({ request }) => {
    const body = (await request.json()) as { name: string; sort_order: number };
    return HttpResponse.json({ id: "cat-new", ...body });
  }),

  http.post("/api/menu", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "item-new", ...(body as object) });
  }),

  http.put("/api/menu/:itemId", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.itemId, ...(body as object) });
  }),

  http.delete("/api/menu/:itemId", () => new HttpResponse(null, { status: 204 })),

  // Gallery
  http.get("/api/gallery", () => HttpResponse.json(mockGalleryImages)),

  http.post("/api/gallery", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "img-new", ...(body as object) });
  }),

  http.put("/api/gallery/reorder", () => new HttpResponse(null, { status: 204 })),

  http.put("/api/gallery/:imageId", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.imageId, ...(body as object) });
  }),

  http.delete("/api/gallery/:imageId", () => new HttpResponse(null, { status: 204 })),

  // Reviews
  http.get("/api/reviews", () => HttpResponse.json(mockReviews)),

  http.get("/api/reviews/pending", () => HttpResponse.json([])),

  http.get("/api/reviews/rating", () => HttpResponse.json(mockRating)),

  http.post("/api/reviews", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "rev-new", ...(body as object), created_at: new Date().toISOString() });
  }),

  http.patch("/api/reviews/:reviewId", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.reviewId, ...(body as object) });
  }),

  // Contact
  http.post("/api/contact", () => HttpResponse.json({ message: "Message sent" })),

  http.get("/api/contact", () => HttpResponse.json(mockContactMessages)),

  http.patch("/api/contact/:messageId/read", () => new HttpResponse(null, { status: 204 })),

  // Settings
  http.get("/api/settings/contact", () => HttpResponse.json(mockContactSettings)),

  http.put("/api/settings/contact", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
];
