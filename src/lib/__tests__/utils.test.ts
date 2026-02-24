import { cn, isValidImageSourceInput, normalizeImageReference, resolveImageSrc } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("isValidImageSourceInput", () => {
  it("rejects empty strings", () => {
    expect(isValidImageSourceInput("")).toBe(false);
    expect(isValidImageSourceInput("   ")).toBe(false);
  });

  it("rejects file: protocol", () => {
    expect(isValidImageSourceInput("file:///etc/passwd")).toBe(false);
  });

  it("accepts https URLs", () => {
    expect(isValidImageSourceInput("https://example.com/photo.jpg")).toBe(true);
  });

  it("accepts http URLs", () => {
    expect(isValidImageSourceInput("http://example.com/photo.jpg")).toBe(true);
  });

  it("accepts protocol-relative URLs", () => {
    expect(isValidImageSourceInput("//example.com/photo.jpg")).toBe(true);
  });

  it("accepts absolute paths", () => {
    expect(isValidImageSourceInput("/images/photo.jpg")).toBe(true);
  });

  it("accepts public/ paths", () => {
    expect(isValidImageSourceInput("public/photo.jpg")).toBe(true);
  });

  it("accepts relative paths without protocol", () => {
    expect(isValidImageSourceInput("photo.jpg")).toBe(true);
  });
});

describe("normalizeImageReference", () => {
  it("returns remote URLs unchanged", () => {
    expect(normalizeImageReference("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
  });

  it("returns data: URLs unchanged", () => {
    expect(normalizeImageReference("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });

  it("returns blob: URLs unchanged", () => {
    expect(normalizeImageReference("blob:http://localhost/abc")).toBe("blob:http://localhost/abc");
  });

  it("strips public/ prefix", () => {
    expect(normalizeImageReference("public/photo.jpg")).toBe("/photo.jpg");
  });

  it("keeps leading slash", () => {
    expect(normalizeImageReference("/photo.jpg")).toBe("/photo.jpg");
  });

  it("adds leading slash to bare filenames", () => {
    expect(normalizeImageReference("photo.jpg")).toBe("/photo.jpg");
  });

  it("trims whitespace", () => {
    expect(normalizeImageReference("  /photo.jpg  ")).toBe("/photo.jpg");
  });
});

describe("resolveImageSrc", () => {
  it("returns fallback for null", () => {
    expect(resolveImageSrc(null)).toBe("/placeholder.svg");
  });

  it("returns fallback for undefined", () => {
    expect(resolveImageSrc(undefined)).toBe("/placeholder.svg");
  });

  it("returns fallback for empty string", () => {
    expect(resolveImageSrc("")).toBe("/placeholder.svg");
  });

  it("returns custom fallback when specified", () => {
    expect(resolveImageSrc(null, "/default.png")).toBe("/default.png");
  });

  it("normalizes valid source", () => {
    expect(resolveImageSrc("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
  });

  it("normalizes public path", () => {
    expect(resolveImageSrc("public/photo.jpg")).toBe("/photo.jpg");
  });
});
