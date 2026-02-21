/**
 * API client for Cafe Kaya backend.
 * In dev, use Vite proxy: /api -> http://localhost:8000
 * In prod, set VITE_API_URL to the backend origin.
 */
const baseURL = import.meta.env.VITE_API_URL ?? "";

const AUTH_TOKEN_KEY = "kaya_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token == null) localStorage.removeItem(AUTH_TOKEN_KEY);
  else localStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string>; skipAuth?: boolean } = {}
): Promise<T> {
  const { params, skipAuth, ...init } = options;
  const url = params
    ? `${baseURL}${path}?${new URLSearchParams(params).toString()}`
    : `${baseURL}${path}`;
  const token = skipAuth ? null : getStoredToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Shared contracts
export interface CollectionMeta {
  total: number;
  limit?: number;
  offset?: number;
}

export interface CollectionResponse<T> {
  data: T[];
  meta: CollectionMeta;
}

// Types (match backend schemas)
export interface CategoryResponse {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category_id: string;
  category_name: string | null;
  image_url: string | null;
  sort_order: number;
  is_available: boolean;
}

export interface MenuCategoryCreateInput {
  name: string;
  sort_order: number;
}

export interface MenuItemCreateInput {
  name: string;
  description?: string | null;
  price: string;
  category_id: string;
  image_url?: string | null;
  sort_order?: number;
  is_available?: boolean;
}

export type MenuItemUpdateInput = Partial<MenuItemCreateInput>;

export interface GalleryImageResponse {
  id: string;
  image_url: string;
  alt: string;
  span: string;
  sort_order: number;
}

export interface GalleryImageCreateInput {
  image_url: string;
  alt?: string;
  span?: string;
  sort_order?: number;
}

export type GalleryImageUpdateInput = Partial<GalleryImageCreateInput>;

export interface ReviewResponse {
  id: string;
  name: string;
  text: string;
  rating: number;
  created_at?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewRatingResponse {
  average: number;
  count: number;
}

export interface ContactMessageResponse {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string | null;
}

export type ContactMessageStatus = "new" | "resolved";

export interface ContactSettingsResponse {
  address?: string | null;
  phone?: string | null;
  hours?: string | null;
  map_embed_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
}

// Auth (match backend schemas)
export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export function getMe(): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/me");
}

// Menu (public + admin)
export function getMenuCategories(): Promise<CategoryResponse[]> {
  return request<CategoryResponse[]>("/api/menu/categories");
}

export function createMenuCategory(data: MenuCategoryCreateInput): Promise<CategoryResponse> {
  return request<CategoryResponse>("/api/menu/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMenu(category?: string): Promise<MenuItemResponse[]> {
  return request<MenuItemResponse[]>(
    "/api/menu",
    category ? { params: { category } } : {}
  );
}

export function createMenuItem(data: MenuItemCreateInput): Promise<MenuItemResponse> {
  return request<MenuItemResponse>("/api/menu", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMenuItem(itemId: string, data: MenuItemUpdateInput): Promise<MenuItemResponse> {
  return request<MenuItemResponse>(`/api/menu/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteMenuItem(itemId: string): Promise<void> {
  return request<void>(`/api/menu/${itemId}`, {
    method: "DELETE",
  });
}

// Gallery (public + admin)
export function getGallery(): Promise<GalleryImageResponse[]> {
  return request<GalleryImageResponse[]>("/api/gallery");
}

export function createGalleryImage(data: GalleryImageCreateInput): Promise<GalleryImageResponse> {
  return request<GalleryImageResponse>("/api/gallery", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGalleryImage(
  imageId: string,
  data: GalleryImageUpdateInput
): Promise<GalleryImageResponse> {
  return request<GalleryImageResponse>(`/api/gallery/${imageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteGalleryImage(imageId: string): Promise<void> {
  return request<void>(`/api/gallery/${imageId}`, {
    method: "DELETE",
  });
}

export function reorderGallery(orderedIds: string[]): Promise<void> {
  return request<void>("/api/gallery/reorder", {
    method: "PUT",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

// Reviews
export function getReviews(limit = 50, offset = 0): Promise<ReviewResponse[]> {
  return request<ReviewResponse[]>("/api/reviews", {
    params: { limit: String(limit), offset: String(offset) },
  });
}

export function getPendingReviews(): Promise<ReviewResponse[]> {
  return request<ReviewResponse[]>("/api/reviews/pending");
}

export function updateReviewStatus(reviewId: string, status: Extract<ReviewStatus, "approved" | "rejected">): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/api/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getReviewsRating(): Promise<ReviewRatingResponse> {
  return request<ReviewRatingResponse>("/api/reviews/rating");
}

export function submitReview(data: {
  name: string;
  text: string;
  rating: number;
  email?: string;
}): Promise<ReviewResponse> {
  return request<ReviewResponse>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Contact
export function submitContact(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getContactMessages(): Promise<ContactMessageResponse[]> {
  return request<ContactMessageResponse[]>("/api/contact");
}

export function markContactMessageRead(messageId: string): Promise<void> {
  return request<void>(`/api/contact/${messageId}/read`, {
    method: "PATCH",
  });
}

// Settings (contact info)
export function getContactSettings(): Promise<ContactSettingsResponse> {
  return request<ContactSettingsResponse>("/api/settings/contact");
}

export function updateContactSettings(data: ContactSettingsResponse): Promise<ContactSettingsResponse> {
  return request<ContactSettingsResponse>("/api/settings/contact", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
