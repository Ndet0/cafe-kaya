import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const REMOTE_IMAGE_PREFIX = /^(https?:)?\/\//i;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidImageSourceInput(source: string): boolean {
  const value = source.trim();
  if (!value) return false;

  if (value.startsWith("file:")) return false;

  if (REMOTE_IMAGE_PREFIX.test(value)) return true;

  return value.startsWith("/") || value.startsWith("public/") || !value.includes("://");
}

export function normalizeImageReference(source: string): string {
  const value = source.trim();

  if (REMOTE_IMAGE_PREFIX.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  const withoutPublicPrefix = value.startsWith("public/") ? value.slice("public/".length) : value;

  return withoutPublicPrefix.startsWith("/") ? withoutPublicPrefix : `/${withoutPublicPrefix}`;
}

export function resolveImageSrc(source: string | null | undefined, fallback = "/placeholder.svg"): string {
  if (!source || !source.trim()) return fallback;

  return normalizeImageReference(source);
}
