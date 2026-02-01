/**
 * Tests for createStorageValuesStore function.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localStorageAdapter, sessionStorageAdapter } from "./adapters";
import { createStorageValuesStore } from "./create-storage-values-store";

describe("createStorageValuesStore", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("initialization", () => {
    it("initializes with empty object when storage is empty", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      expect(store.$value.get()).toEqual({});
    });

    it("initializes with existing storage values", () => {
      localStorage.setItem("a", "1");
      localStorage.setItem("b", "2");
      const store = createStorageValuesStore(localStorageAdapter);
      expect(store.$value.get()).toEqual({ a: "1", b: "2" });
    });
  });

  describe("adapter selection", () => {
    it("uses localStorage adapter", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      expect(localStorage.getItem("key")).toBe("value");
    });

    it("uses sessionStorage adapter", () => {
      const store = createStorageValuesStore(sessionStorageAdapter);
      store.set("key", "value");
      expect(sessionStorage.getItem("key")).toBe("value");
      expect(localStorage.getItem("key")).toBeNull();
    });
  });

  describe("set operation", () => {
    it("sets a single value", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      expect(store.$value.get()).toEqual({ key: "value" });
      expect(localStorage.getItem("key")).toBe("value");
    });

    it("updates existing value", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value1");
      store.set("key", "value2");
      expect(store.$value.get()).toEqual({ key: "value2" });
    });

    it("preserves other values when setting", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.set("b", "2");
      expect(store.$value.get()).toEqual({ a: "1", b: "2" });
    });
  });

  describe("update operation", () => {
    it("updates multiple values at once", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("existing", "value");
      store.update({ a: "1", b: "2" });
      expect(store.$value.get()).toEqual({ existing: "value", a: "1", b: "2" });
    });

    it("updates with function", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("count", "5");
      store.update((current) => {
        const countValue = (current as { count?: string }).count;
        return {
          ...current,
          count: String(Number(countValue) + 1),
        };
      });
      expect(store.$value.get()).toEqual({ count: "6" });
    });

    it("replaces values in function update", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.update(() => ({ b: "2" }));
      expect(store.$value.get()).toEqual({ b: "2" });
    });
  });

  describe("get method", () => {
    it("get() returns all values", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.set("b", "2");
      expect(store.get()).toEqual({ a: "1", b: "2" });
    });

    it("get(key) returns single value", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      expect(store.get("key")).toBe("value");
    });

    it("get(key) returns undefined for non-existent key", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      expect(store.get("nonexistent")).toBeUndefined();
    });
  });

  describe("remove method", () => {
    it("removes a single key", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.set("b", "2");
      store.remove("a");
      expect(store.$value.get()).toEqual({ b: "2" });
      expect(localStorage.getItem("a")).toBeNull();
    });

    it("removes multiple keys", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.set("b", "2");
      store.set("c", "3");
      store.remove(["a", "b"]);
      expect(store.$value.get()).toEqual({ c: "3" });
    });

    it("handles removing non-existent key", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.remove("non-existent");
      expect(store.$value.get()).toEqual({ a: "1" });
    });
  });

  describe("clear method", () => {
    it("removes all values from storage", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.set("b", "2");
      store.clear();
      expect(store.get()).toEqual({});
      expect(localStorage.length).toBe(0);
    });
  });

  describe("sync method", () => {
    it("syncs from storage to store", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      // Directly modify storage without going through store
      localStorage.setItem("external", "value");
      store.sync();
      expect(store.get("external")).toBe("value");
    });

    it("does not write back to storage during sync", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      localStorage.setItem("b", "2");
      store.sync();
      expect(localStorage.getItem("a")).toBe("1");
      expect(localStorage.getItem("b")).toBe("2");
    });
  });

  describe("$value is read-only", () => {
    it("$value is typed as ReadableAtom (use methods to modify)", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      // $value is a ReadableAtom - TypeScript prevents calling .set() directly
      // Users must use store.set(key, value) instead of store.$value.set()
      store.set("key", "value");
      expect(store.$value.get()).toEqual({ key: "value" });
    });
  });

  describe("shallow equality optimization", () => {
    it("set() does not change instance when value is the same", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      const before = store.$value.get();
      store.set("key", "value");
      const after = store.$value.get();
      expect(before).toBe(after);
    });

    it("update() does not change instance when values are the same", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("a", "1");
      store.set("b", "2");
      const before = store.$value.get();
      store.update({ a: "1", b: "2" });
      const after = store.$value.get();
      expect(before).toBe(after);
    });

    it("update() with function does not change instance when returning equivalent value", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      const before = store.$value.get();
      store.update((current) => ({ ...current }));
      const after = store.$value.get();
      expect(before).toBe(after);
    });

    it("remove() does not change instance when key does not exist", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      const before = store.$value.get();
      store.remove("nonexistent");
      const after = store.$value.get();
      expect(before).toBe(after);
    });

    it("clear() does not change instance when already empty", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      const before = store.$value.get();
      store.clear();
      const after = store.$value.get();
      expect(before).toBe(after);
    });

    it("sync() does not change instance when storage matches store", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");
      const before = store.$value.get();
      store.sync();
      const after = store.$value.get();
      expect(before).toBe(after);
    });

    it("does not notify subscribers when value is unchanged", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      store.set("key", "value");

      const callback = vi.fn();
      store.$value.subscribe(callback);
      // First call is immediate with current value
      expect(callback).toHaveBeenCalledTimes(1);

      // These should not trigger additional notifications
      store.set("key", "value");
      store.update({ key: "value" });
      store.remove("nonexistent");
      store.sync();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscription", () => {
    it("notifies subscribers on value change", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      const callback = vi.fn();

      store.$value.subscribe(callback);
      // First call is immediate with initial value ({})
      expect(callback).toHaveBeenCalledTimes(1);

      store.set("key", "value");
      // Second call is with the new value
      expect(callback).toHaveBeenCalledTimes(2);
      // Check last call has the new value
      const lastCallArgs = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCallArgs?.[0]).toEqual({ key: "value" });
    });
  });

  describe("listener", () => {
    it("starts listening when listen option is true", () => {
      const store = createStorageValuesStore(localStorageAdapter, {
        listen: true,
      });

      expect(store.listener.$on.get()).toBe(true);

      // Simulate storage event
      localStorage.setItem("test-key", "external-value");
      const event = new StorageEvent("storage", {
        key: "test-key",
        newValue: "external-value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toEqual({ "test-key": "external-value" });
    });

    it("listener.$on is false by default", () => {
      const store = createStorageValuesStore(localStorageAdapter);
      expect(store.listener.$on.get()).toBe(false);
    });

    it("listener.on() begins listening to storage events", () => {
      const store = createStorageValuesStore(localStorageAdapter);

      expect(store.listener.$on.get()).toBe(false);
      store.listener.on();
      expect(store.listener.$on.get()).toBe(true);

      localStorage.setItem("key", "value");
      const event = new StorageEvent("storage", {
        key: "key",
        newValue: "value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toEqual({ key: "value" });
    });

    it("listener.off() stops listening to storage events", () => {
      const store = createStorageValuesStore(localStorageAdapter, {
        listen: true,
      });

      expect(store.listener.$on.get()).toBe(true);
      store.listener.off();
      expect(store.listener.$on.get()).toBe(false);

      localStorage.setItem("key", "value");
      const event = new StorageEvent("storage", {
        key: "key",
        newValue: "value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toEqual({}); // Should not update
    });

    it("listener.on() is idempotent", () => {
      const store = createStorageValuesStore(localStorageAdapter);

      // Call start multiple times
      store.listener.on();
      store.listener.on();
      store.listener.on();

      expect(store.listener.$on.get()).toBe(true);

      // Should still work normally
      localStorage.setItem("key", "value");
      const event = new StorageEvent("storage", {
        key: "key",
        newValue: "value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toEqual({ key: "value" });
    });

    it("listener.off() is idempotent", () => {
      const store = createStorageValuesStore(localStorageAdapter, {
        listen: true,
      });

      store.listener.off();
      store.listener.off();
      store.listener.off();

      expect(store.listener.$on.get()).toBe(false);
    });

    it("can restart listener after stopping", () => {
      const store = createStorageValuesStore(localStorageAdapter);

      store.listener.on();
      expect(store.listener.$on.get()).toBe(true);

      store.listener.off();
      expect(store.listener.$on.get()).toBe(false);

      store.listener.on();
      expect(store.listener.$on.get()).toBe(true);

      localStorage.setItem("key", "value");
      const event = new StorageEvent("storage", {
        key: "key",
        newValue: "value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toEqual({ key: "value" });
    });
  });
});
