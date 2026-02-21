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

// Types (match backend schemas)
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

export interface GalleryImageResponse {
  id: string;
  image_url: string;
  alt: string;
  span: string;
  sort_order: number;
}

export interface ReviewResponse {
  id: string;
  name: string;
  text: string;
  rating: number;
  created_at?: string;
}

export interface ReviewRatingResponse {
  average: number;
  count: number;
}

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

// Menu
export function getMenu(category?: string): Promise<MenuItemResponse[]> {
  return request<MenuItemResponse[]>(
    "/api/menu",
    category ? { params: { category } } : {}
  );
}

// Gallery
export function getGallery(): Promise<GalleryImageResponse[]> {
  return request<GalleryImageResponse[]>("/api/gallery");
}

// Reviews
export function getReviews(limit = 50, offset = 0): Promise<ReviewResponse[]> {
  return request<ReviewResponse[]>("/api/reviews", {
    params: { limit: String(limit), offset: String(offset) },
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

// Settings (contact info)
export function getContactSettings(): Promise<ContactSettingsResponse> {
  return request<ContactSettingsResponse>("/api/settings/contact");
}
