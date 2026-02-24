import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth;
  let listeners: Array<() => void> = [];

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_: string, cb: () => void) => { listeners.push(cb); },
        removeEventListener: (_: string, cb: () => void) => {
          listeners = listeners.filter((l) => l !== cb);
        },
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: originalInnerWidth });
  });

  it("returns false for desktop width", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true for mobile width", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 500 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when window resizes", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 500 });
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});
