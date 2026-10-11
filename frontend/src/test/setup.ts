import "@testing-library/jest-dom";

// Mock ResizeObserver for Recharts
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.open
if (typeof window !== "undefined") {
  window.open = () => null;
}
