import {
  getStoredToken,
  setStoredToken,
  login,
  getMe,
  getMenu,
  getMenuCategories,
  createMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGallery,
  getReviews,
  getPendingReviews,
  getReviewsRating,
  updateReviewStatus,
  submitReview,
  submitContact,
  getContactMessages,
  markContactMessageRead,
  getContactSettings,
  updateContactSettings,
  uploadImage,
} from "../api";

describe("token management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("stores and retrieves token", () => {
    setStoredToken("test-token");
    expect(getStoredToken()).toBe("test-token");
  });

  it("removes token when set to null", () => {
    setStoredToken("test-token");
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });
});

describe("login", () => {
  it("returns token on valid credentials", async () => {
    const result = await login("admin@cafekaya.com", "password");
    expect(result.access_token).toBe("mock-jwt-token");
  });

  it("throws on invalid credentials", async () => {
    await expect(login("wrong@example.com", "wrong")).rejects.toThrow("Invalid credentials");
  });
});

describe("getMe", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns user when authenticated", async () => {
    setStoredToken("mock-jwt-token");
    const user = await getMe();
    expect(user.email).toBe("admin@cafekaya.com");
    expect(user.role).toBe("admin");
  });

  it("throws when not authenticated", async () => {
    await expect(getMe()).rejects.toThrow("Not authenticated");
  });
});

describe("menu endpoints", () => {
  it("getMenu returns items", async () => {
    const items = await getMenu();
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe("Espresso");
  });

  it("getMenuCategories returns categories", async () => {
    const categories = await getMenuCategories();
    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe("Coffee");
  });

  it("createMenuCategory returns new category", async () => {
    const cat = await createMenuCategory({ name: "Desserts", sort_order: 2 });
    expect(cat.name).toBe("Desserts");
    expect(cat.id).toBeDefined();
  });

  it("createMenuItem returns new item", async () => {
    setStoredToken("mock-jwt-token");
    const item = await createMenuItem({
      name: "Latte",
      price: "400",
      category_id: "cat-1",
    });
    expect(item.name).toBe("Latte");
  });

  it("updateMenuItem returns updated item", async () => {
    setStoredToken("mock-jwt-token");
    const item = await updateMenuItem("item-1", { price: "500" });
    expect(item.id).toBe("item-1");
  });

  it("deleteMenuItem completes without error", async () => {
    setStoredToken("mock-jwt-token");
    await expect(deleteMenuItem("item-1")).resolves.toBeUndefined();
  });
});

describe("gallery endpoints", () => {
  it("getGallery returns images", async () => {
    const images = await getGallery();
    expect(images).toHaveLength(2);
  });

  it("createGalleryImage returns new image", async () => {
    setStoredToken("mock-jwt-token");
    const img = await createGalleryImage({ image_url: "https://example.com/new.jpg" });
    expect(img.id).toBeDefined();
  });

  it("updateGalleryImage returns updated image", async () => {
    setStoredToken("mock-jwt-token");
    const img = await updateGalleryImage("img-1", { alt: "Updated" });
    expect(img.id).toBe("img-1");
  });

  it("deleteGalleryImage completes without error", async () => {
    setStoredToken("mock-jwt-token");
    await expect(deleteGalleryImage("img-1")).resolves.toBeUndefined();
  });

  it("reorderGallery completes without error", async () => {
    setStoredToken("mock-jwt-token");
    await expect(reorderGallery(["img-2", "img-1"])).resolves.toBeUndefined();
  });
});

describe("reviews endpoints", () => {
  it("getReviews returns reviews list response", async () => {
    const data = await getReviews();
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews[0].name).toBe("Alice");
    expect(data.rating).toBe(4.7);
    expect(data.total_reviews).toBe(120);
  });

  it("getPendingReviews returns array", async () => {
    setStoredToken("mock-jwt-token");
    const pending = await getPendingReviews();
    expect(Array.isArray(pending)).toBe(true);
  });

  it("getReviewsRating returns rating data", async () => {
    const rating = await getReviewsRating();
    expect(rating.average).toBe(4.5);
    expect(rating.count).toBe(42);
  });

  it("updateReviewStatus returns updated review", async () => {
    setStoredToken("mock-jwt-token");
    const result = await updateReviewStatus("rev-1", "approved");
    expect(result.id).toBe("rev-1");
  });

  it("submitReview returns new review", async () => {
    const review = await submitReview({ name: "Carol", text: "Love it", rating: 5 });
    expect(review.id).toBeDefined();
  });
});

describe("contact endpoints", () => {
  it("submitContact returns success", async () => {
    const result = await submitContact({
      name: "Test",
      email: "test@test.com",
      message: "Hello",
    });
    expect(result.message).toBe("Message sent");
  });

  it("getContactMessages returns messages", async () => {
    setStoredToken("mock-jwt-token");
    const messages = await getContactMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].name).toBe("Jane");
  });

  it("markContactMessageRead completes without error", async () => {
    setStoredToken("mock-jwt-token");
    await expect(markContactMessageRead("msg-1")).resolves.toBeUndefined();
  });
});

describe("settings endpoints", () => {
  it("getContactSettings returns settings", async () => {
    setStoredToken("mock-jwt-token");
    const settings = await getContactSettings();
    expect(settings.phone).toBe("+254710767717");
  });

  it("updateContactSettings returns updated settings", async () => {
    setStoredToken("mock-jwt-token");
    const settings = await updateContactSettings({
      address: "New Address",
      phone: "+254700000000",
    });
    expect(settings.address).toBe("New Address");
  });
});

describe("uploadImage", () => {
  beforeEach(() => {
    setStoredToken("mock-jwt-token");
  });

  it("returns URL on successful upload", async () => {
    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" });
    const result = await uploadImage(file);
    expect(result.url).toBe("https://example.com/uploaded.jpg");
  });

  it("throws when not authenticated", async () => {
    setStoredToken(null);
    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" });
    await expect(uploadImage(file)).rejects.toThrow("Not authenticated");
  });
});
