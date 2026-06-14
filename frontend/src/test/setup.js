// Vitest setup: adds jest-dom matchers (toBeInTheDocument, etc.) and a
// matchMedia shim so framer-motion's useReducedMotion doesn't crash in jsdom.
import "@testing-library/jest-dom/vitest";

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// framer-motion's `whileInView` uses IntersectionObserver, which jsdom lacks.
if (!window.IntersectionObserver) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = IO;
  globalThis.IntersectionObserver = IO;
}
