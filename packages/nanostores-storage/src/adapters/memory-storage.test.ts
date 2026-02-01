/**
 * Tests for memory storage adapter.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryAdapter } from "./memory-storage";

describe("createMemoryAdapter", () => {
  let adapter: ReturnType<typeof createMemoryAdapter>;

  beforeEach(() => {
    adapter = createMemoryAdapter();
  });

  describe("basic operations", () => {
    it("get returns null for non-existent key", () => {
      expect(adapter.get("nonexistent")).toBeNull();
    });

    it("set and get work correctly", () => {
      adapter.set("key", "value");
      expect(adapter.get("key")).toBe("value");
    });

    it("remove deletes the key", () => {
      adapter.set("key", "value");
      adapter.remove("key");
      expect(adapter.get("key")).toBeNull();
    });

    it("handles special characters in values", () => {
      const specialValue = 'hello\nworld\t"quotes"';
      adapter.set("key", specialValue);
      expect(adapter.get("key")).toBe(specialValue);
    });
  });

  describe("bulk operations", () => {
    it("getAll returns all values", () => {
      adapter.set("a", "1");
      adapter.set("b", "2");
      expect(adapter.getAll()).toEqual({ a: "1", b: "2" });
    });

    it("getAll returns empty object when storage is empty", () => {
      expect(adapter.getAll()).toEqual({});
    });

    it("setAll replaces all values", () => {
      adapter.set("old", "value");
      adapter.setAll({ new1: "value1", new2: "value2" });

      expect(adapter.get("old")).toBeNull();
      expect(adapter.get("new1")).toBe("value1");
      expect(adapter.get("new2")).toBe("value2");
    });

    it("clear removes all values", () => {
      adapter.set("a", "1");
      adapter.set("b", "2");
      adapter.clear();

      expect(adapter.getAll()).toEqual({});
    });
  });

  describe("subscription", () => {
    it("subscribe returns a noop unsubscribe function", () => {
      // Memory adapter cannot detect external changes (each tab has its own
      // JavaScript context), so subscribe is a no-op.
      const callback = vi.fn();
      const unsubscribe = adapter.subscribe(callback);

      adapter.set("key", "value");
      adapter.remove("key");
      adapter.setAll({ a: "1" });
      adapter.clear();

      // Callback should never be called
      expect(callback).not.toHaveBeenCalled();
      // Unsubscribe should be callable without error
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe("initial data", () => {
    it("initializes with provided data", () => {
      const adapterWithData = createMemoryAdapter({
        theme: "dark",
        language: "en",
      });

      expect(adapterWithData.get("theme")).toBe("dark");
      expect(adapterWithData.get("language")).toBe("en");
    });

    it("getAll returns initial data", () => {
      const adapterWithData = createMemoryAdapter({
        a: "1",
        b: "2",
      });

      expect(adapterWithData.getAll()).toEqual({ a: "1", b: "2" });
    });
  });

  describe("isolation", () => {
    it("separate instances are isolated", () => {
      const adapter1 = createMemoryAdapter();
      const adapter2 = createMemoryAdapter();

      adapter1.set("key", "value1");
      adapter2.set("key", "value2");

      expect(adapter1.get("key")).toBe("value1");
      expect(adapter2.get("key")).toBe("value2");
    });
  });
});
