/**
 * Tests for createStorageStore function.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localStorageAdapter, sessionStorageAdapter } from "./adapters";
import { createStorageStore } from "./create-storage-store";

describe("createStorageStore", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("initialization", () => {
    it("initializes with null when storage is empty", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      expect(store.$value.get()).toBeNull();
    });

    it("initializes with existing storage value", () => {
      localStorage.setItem("test-key", "existing");
      const store = createStorageStore(localStorageAdapter, "test-key");
      expect(store.$value.get()).toBe("existing");
    });

    it("uses defaultValue when storage is empty (not written to storage)", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
        defaultValue: "default",
      });
      expect(store.$value.get()).toBe("default");
      // defaultValue should NOT be written to storage
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("ignores defaultValue when storage has value", () => {
      localStorage.setItem("test-key", "existing");
      const store = createStorageStore(localStorageAdapter, "test-key", {
        defaultValue: "default",
      });
      expect(store.$value.get()).toBe("existing");
    });

    it("handles null defaultValue", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
        defaultValue: null,
      });
      expect(store.$value.get()).toBeNull();
    });
  });

  describe("adapter selection", () => {
    it("uses localStorage adapter", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      store.set("value");
      expect(localStorage.getItem("test-key")).toBe("value");
    });

    it("uses sessionStorage adapter", () => {
      const store = createStorageStore(sessionStorageAdapter, "test-key");
      store.set("value");
      expect(sessionStorage.getItem("test-key")).toBe("value");
      expect(localStorage.getItem("test-key")).toBeNull();
    });
  });

  describe("array adapters (fallback chain)", () => {
    it("reads from first adapter with value", () => {
      sessionStorage.setItem("test-key", "session-value");
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key");
      expect(store.$value.get()).toBe("session-value");
    });

    it("falls back to second adapter when first is empty", () => {
      localStorage.setItem("test-key", "local-value");
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key");
      expect(store.$value.get()).toBe("local-value");
    });

    it("writes to all adapters", () => {
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key");
      store.set("new-value");

      expect(sessionStorage.getItem("test-key")).toBe("new-value");
      expect(localStorage.getItem("test-key")).toBe("new-value");
    });

    it("uses defaultValue as fallback (not written to storages)", () => {
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key", {
        defaultValue: "default",
      });

      expect(store.$value.get()).toBe("default");
      // defaultValue should NOT be written to any storage
      expect(sessionStorage.getItem("test-key")).toBeNull();
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("remove removes from all storages", () => {
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key", {
        defaultValue: "default",
      });
      store.set("value");
      store.remove();

      expect(sessionStorage.getItem("test-key")).toBeNull();
      expect(localStorage.getItem("test-key")).toBeNull();
      expect(store.$value.get()).toBeNull();
    });

    it("prefers first adapter value over later ones", () => {
      sessionStorage.setItem("test-key", "session");
      localStorage.setItem("test-key", "local");

      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key");

      expect(store.$value.get()).toBe("session");
    });
  });

  describe("get/set methods", () => {
    it("get() returns current value", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      store.set("value");
      expect(store.get()).toBe("value");
    });

    it("get() returns null when storage is empty", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      expect(store.get()).toBeNull();
    });

    it("set() writes to storage", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      store.set("new-value");
      expect(localStorage.getItem("test-key")).toBe("new-value");
    });

    it("set() writes to all adapters in chain", () => {
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key");
      store.set("value");
      expect(sessionStorage.getItem("test-key")).toBe("value");
      expect(localStorage.getItem("test-key")).toBe("value");
    });
  });

  describe("remove method", () => {
    it("remove() removes from storage and resets to null", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
        defaultValue: "default",
      });
      store.set("value");
      store.remove();

      expect(localStorage.getItem("test-key")).toBeNull();
      expect(store.$value.get()).toBeNull();
    });

    it("remove() resets to null when no defaultValue", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      store.set("value");
      store.remove();

      expect(store.$value.get()).toBeNull();
    });
  });

  describe("sync method", () => {
    it("sync() reads from storage to store", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      // Directly modify storage without going through store
      localStorage.setItem("test-key", "external");
      store.sync();
      expect(store.get()).toBe("external");
    });

    it("sync() does not write back to storage", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      store.set("initial");
      localStorage.setItem("test-key", "external");
      store.sync();
      expect(localStorage.getItem("test-key")).toBe("external");
    });

    it("sync() does not apply defaultValue", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
        defaultValue: "default",
      });
      store.set("value");
      localStorage.removeItem("test-key");
      store.sync();
      // Should be null, not defaultValue
      expect(store.get()).toBeNull();
    });
  });

  describe("$value is read-only", () => {
    it("$value is typed as ReadableAtom (use .set() method to modify)", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      // $value is a ReadableAtom - TypeScript prevents calling .set() directly
      // Users must use store.set() instead of store.$value.set()
      store.set("value");
      expect(store.$value.get()).toBe("value");
    });
  });

  describe("subscription", () => {
    it("notifies subscribers on value change", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      const callback = vi.fn();

      store.$value.subscribe(callback);
      // First call is immediate with initial value (null)
      expect(callback).toHaveBeenCalledTimes(1);

      store.set("new-value");
      // Second call is with the new value
      expect(callback).toHaveBeenCalledTimes(2);
      // Check last call has the new value
      const lastCallArgs = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCallArgs?.[0]).toBe("new-value");
    });
  });

  describe("listener", () => {
    it("starts listening when listen option is true", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
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

      expect(store.$value.get()).toBe("external-value");
    });

    it("listener.$on is false by default", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");
      expect(store.listener.$on.get()).toBe(false);
    });

    it("listener.on() begins listening to storage events", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");

      expect(store.listener.$on.get()).toBe(false);
      store.listener.on();
      expect(store.listener.$on.get()).toBe(true);

      localStorage.setItem("test-key", "external-value");
      const event = new StorageEvent("storage", {
        key: "test-key",
        newValue: "external-value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toBe("external-value");
    });

    it("listener.off() stops listening to storage events", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
        listen: true,
      });

      expect(store.listener.$on.get()).toBe(true);
      store.listener.off();
      expect(store.listener.$on.get()).toBe(false);

      // Simulate storage event
      localStorage.setItem("test-key", "external-value");
      const event = new StorageEvent("storage", {
        key: "test-key",
        newValue: "external-value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toBeNull(); // Should not update
    });

    it("listener.on() is idempotent", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");

      // Call start multiple times
      store.listener.on();
      store.listener.on();
      store.listener.on();

      expect(store.listener.$on.get()).toBe(true);

      // Should still work normally
      localStorage.setItem("test-key", "value");
      const event = new StorageEvent("storage", {
        key: "test-key",
        newValue: "value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toBe("value");
    });

    it("listener.off() is idempotent", () => {
      const store = createStorageStore(localStorageAdapter, "test-key", {
        listen: true,
      });

      store.listener.off();
      store.listener.off();
      store.listener.off();

      expect(store.listener.$on.get()).toBe(false);
    });

    it("listens to first adapter only in array config", () => {
      const store = createStorageStore([sessionStorageAdapter, localStorageAdapter], "test-key", {
        listen: true,
      });

      expect(store.listener.$on.get()).toBe(true);

      // Simulate localStorage event (second adapter - should NOT trigger update)
      localStorage.setItem("test-key", "from-local");
      const localEvent = new StorageEvent("storage", {
        key: "test-key",
        newValue: "from-local",
        storageArea: localStorage,
      });
      window.dispatchEvent(localEvent);

      // Value should NOT update since we only listen to first adapter
      expect(store.$value.get()).toBe(null);

      // Simulate sessionStorage event (first adapter - should trigger update)
      sessionStorage.setItem("test-key", "from-session");
      const sessionEvent = new StorageEvent("storage", {
        key: "test-key",
        newValue: "from-session",
        storageArea: sessionStorage,
      });
      window.dispatchEvent(sessionEvent);

      // Value should update since sessionStorage is the first adapter
      expect(store.$value.get()).toBe("from-session");
    });

    it("can restart listener after stopping", () => {
      const store = createStorageStore(localStorageAdapter, "test-key");

      store.listener.on();
      expect(store.listener.$on.get()).toBe(true);

      store.listener.off();
      expect(store.listener.$on.get()).toBe(false);

      store.listener.on();
      expect(store.listener.$on.get()).toBe(true);

      localStorage.setItem("test-key", "value");
      const event = new StorageEvent("storage", {
        key: "test-key",
        newValue: "value",
        storageArea: localStorage,
      });
      window.dispatchEvent(event);

      expect(store.$value.get()).toBe("value");
    });
  });

  describe("fallback chain error resilience", () => {
    it("continues to next adapter when first adapter fails on read", () => {
      // Create a failing adapter
      const failingAdapter = {
        get: () => {
          throw new Error("Read failed");
        },
        set: () => {},
        remove: () => {},
        getAll: () => ({}),
        setAll: () => {},
        clear: () => {},
        subscribe: () => () => {},
      };

      localStorage.setItem("test-key", "fallback-value");

      const store = createStorageStore([failingAdapter, localStorageAdapter], "test-key");

      // Should fall back to localStorage value
      expect(store.get()).toBe("fallback-value");
    });

    it("returns null when all adapters fail on read", () => {
      const failingAdapter1 = {
        get: () => {
          throw new Error("Read failed 1");
        },
        set: () => {},
        remove: () => {},
        getAll: () => ({}),
        setAll: () => {},
        clear: () => {},
        subscribe: () => () => {},
      };

      const failingAdapter2 = {
        get: () => {
          throw new Error("Read failed 2");
        },
        set: () => {},
        remove: () => {},
        getAll: () => ({}),
        setAll: () => {},
        clear: () => {},
        subscribe: () => () => {},
      };

      const store = createStorageStore([failingAdapter1, failingAdapter2], "test-key");

      // Should return null when all adapters fail
      expect(store.get()).toBeNull();
    });
  });
});
