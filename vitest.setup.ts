import "@testing-library/jest-dom/vitest";
// In-memory IndexedDB implementation so the storage layer can be tested
// in Node/jsdom exactly as it runs in the browser.
import "fake-indexeddb/auto";
