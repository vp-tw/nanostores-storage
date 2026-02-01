/**
 * Tests for Web Storage adapter (localStorage and sessionStorage).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWebStorageAdapter } from "./web-storage";

describe.each([
  { name: "localStorage", storage: localStorage },
  { name: "sessionStorage", storage: sessionStorage },
])("createWebStorageAdapter with $name", ({ name, storage }) => {
  let adapter: ReturnType<typeof createWebStorageAdapter>;

  beforeEach(() => {
    storage.clear();
    adapter = createWebStorageAdapter(storage);
  });

  afterEach(() => {
    storage.clear();
  });

  describe("basic operations", () => {
    it("returns null for non-existent key", () => {
      expect(adapter.get("missing")).toBeNull();
    });

    it("stores and retrieves a value", () => {
      adapter.set("key", "value");
      expect(adapter.get("key")).toBe("value");
      expect(storage.getItem("key")).toBe("value");
    });

    it("removes a value", () => {
      adapter.set("key", "value");
      adapter.remove("key");
      expect(adapter.get("key")).toBeNull();
      expect(storage.getItem("key")).toBeNull();
    });

    it("handles special characters in values", () => {
      const specialValue = '{"json": true, "emoji": "🎉"}';
      adapter.set("special", specialValue);
      expect(adapter.get("special")).toBe(specialValue);
    });
  });

  describe("getAll and setAll", () => {
    it("returns all stored values", () => {
      storage.setItem("a", "1");
      storage.setItem("b", "2");
      expect(adapter.getAll()).toEqual({ a: "1", b: "2" });
    });

    it("replaces all values with setAll", () => {
      storage.setItem("old", "value");
      adapter.setAll({ new1: "a", new2: "b" });
      expect(adapter.getAll()).toEqual({ new1: "a", new2: "b" });
    });

    it("clear removes all values", () => {
      adapter.set("a", "1");
      adapter.set("b", "2");
      adapter.clear();
      expect(adapter.getAll()).toEqual({});
    });
  });

  describe("storage event subscription", () => {
    it("subscribes and unsubscribes to storage events", () => {
      const callback = vi.fn();
      const unsubscribe = adapter.subscribe(callback);

      // Simulate storage event
      const event = new StorageEvent("storage", {
        key: "test-key",
        newValue: "new-value",
        storageArea: storage,
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith("test-key");

      unsubscribe();

      // After unsubscribe, callback should not be called
      const event2 = new StorageEvent("storage", {
        key: "test-key-2",
        storageArea: storage,
      });
      window.dispatchEvent(event2);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("ignores events from other storage areas", () => {
      const callback = vi.fn();
      adapter.subscribe(callback);

      // Simulate event from the OTHER storage
      const otherStorage = name === "localStorage" ? sessionStorage : localStorage;
      const event = new StorageEvent("storage", {
        key: "test-key",
        storageArea: otherStorage,
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it("isolates failing callbacks from other subscribers", () => {
      const callback1 = vi.fn(() => {
        throw new Error("callback1 error");
      });
      const callback2 = vi.fn();

      adapter.subscribe(callback1);
      adapter.subscribe(callback2);

      const event = new StorageEvent("storage", {
        key: "test-key",
        storageArea: storage,
      });
      window.dispatchEvent(event);

      // Both callbacks should be called, error in callback1 shouldn't affect callback2
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });
});

describe("createWebStorageAdapter error handling", () => {
  it("handles storage errors gracefully on get", () => {
    const mockStorage = {
      getItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    const adapter = createWebStorageAdapter(mockStorage);
    // Should return null instead of throwing
    expect(adapter.get("key")).toBeNull();
  });

  it("handles storage errors gracefully on set", () => {
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    const adapter = createWebStorageAdapter(mockStorage);
    // Should not throw
    expect(() => adapter.set("key", "value")).not.toThrow();
  });

  it("handles storage errors gracefully on remove", () => {
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(() => {
        throw new Error("SecurityError");
      }),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    const adapter = createWebStorageAdapter(mockStorage);
    // Should not throw
    expect(() => adapter.remove("key")).not.toThrow();
  });

  it("handles storage errors gracefully on clear", () => {
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(() => {
        throw new Error("SecurityError");
      }),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    const adapter = createWebStorageAdapter(mockStorage);
    // Should not throw
    expect(() => adapter.clear()).not.toThrow();
  });

  it("handles storage errors gracefully on getAll", () => {
    const mockStorage = {
      getItem: vi.fn(() => {
        throw new Error("SecurityError");
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn((i: number) => (i === 0 ? "key1" : null)),
      length: 1,
    } as unknown as Storage;

    const adapter = createWebStorageAdapter(mockStorage);
    // Should return partial result (empty) instead of throwing
    expect(adapter.getAll()).toEqual({});
  });

  it("continues writing other keys when one fails in setAll", () => {
    let setCount = 0;
    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn((key: string) => {
        setCount++;
        if (key === "key1") {
          throw new Error("QuotaExceededError");
        }
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(() => null),
      length: 0,
    } as unknown as Storage;

    const adapter = createWebStorageAdapter(mockStorage);
    // Should not throw and should attempt to write all keys
    expect(() => adapter.setAll({ key1: "a", key2: "b", key3: "c" })).not.toThrow();
    expect(setCount).toBe(3); // All three keys should be attempted
  });
});
