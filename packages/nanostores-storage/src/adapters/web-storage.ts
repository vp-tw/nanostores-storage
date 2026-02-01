/**
 * Shared Web Storage adapter factory.
 * Creates adapters for localStorage and sessionStorage using the same implementation.
 * Supports SSR environments by deferring Storage access until runtime.
 */

import type { StorageAdapter } from "../types";

/**
 * Check if running in a browser environment.
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Check if running in development mode.
 * Uses a safe approach that works in both Node.js and browser environments.
 */
function isDev(): boolean {
  try {
    // eslint-disable-next-line node/prefer-global/process, dot-notation
    return typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production";
  } catch {
    return false;
  }
}

/**
 * Logs a warning in development mode only.
 */
function warnDev(message: string, error?: unknown): void {
  if (isDev()) {
    if (error) {
      console.warn(`[nanostores-storage] ${message}`, error);
    } else {
      console.warn(`[nanostores-storage] ${message}`);
    }
  }
}

/**
 * Creates a Web Storage adapter for the given Storage object.
 * Works with both localStorage and sessionStorage.
 *
 * Note: This should only be called in browser environments.
 * For SSR-safe usage, use createLazyWebStorageAdapter instead.
 */
export function createWebStorageAdapter(storage: Storage): StorageAdapter {
  const listeners = new Set<(key: string | null) => void>();

  const handleStorageEvent = (event: StorageEvent): void => {
    // Only handle events for the correct storage area
    if (event.storageArea !== storage) return;

    for (const callback of listeners) {
      try {
        callback(event.key);
      } catch {
        // Prevent one failing callback from breaking others
      }
    }
  };

  return {
    get(key: string): string | null {
      try {
        return storage.getItem(key);
      } catch (error) {
        warnDev(`Failed to read key "${key}"`, error);
        return null;
      }
    },

    set(key: string, value: string): void {
      try {
        storage.setItem(key, value);
      } catch (error) {
        warnDev(`Failed to write key "${key}" (possibly quota exceeded or private mode)`, error);
      }
    },

    remove(key: string): void {
      try {
        storage.removeItem(key);
      } catch (error) {
        warnDev(`Failed to remove key "${key}"`, error);
      }
    },

    getAll(): Record<string, string> {
      const result: Record<string, string> = {};
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key !== null) {
            const value = storage.getItem(key);
            if (value !== null) {
              result[key] = value;
            }
          }
        }
      } catch (error) {
        warnDev("Failed to read all storage values", error);
      }
      return result;
    },

    setAll(values: Record<string, string>): void {
      // Remove keys not in new values (safer than clear() for concurrent access)
      try {
        const keysToRemove: Array<string> = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key !== null && !(key in values)) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          storage.removeItem(key);
        }
      } catch (error) {
        warnDev("Failed to remove old keys during setAll", error);
      }

      // Set new values (only if changed to avoid unnecessary storage events)
      for (const [key, value] of Object.entries(values)) {
        try {
          if (storage.getItem(key) !== value) {
            storage.setItem(key, value);
          }
        } catch (error) {
          warnDev(`Failed to write key "${key}" during setAll`, error);
        }
      }
    },

    clear(): void {
      try {
        storage.clear();
      } catch (error) {
        warnDev("Failed to clear storage", error);
      }
    },

    subscribe(callback: (key: string | null) => void): () => void {
      listeners.add(callback);

      // Add window listener if this is the first subscriber
      if (listeners.size === 1) {
        try {
          window.addEventListener("storage", handleStorageEvent);
        } catch (error) {
          warnDev("Failed to add storage event listener", error);
        }
      }

      return () => {
        listeners.delete(callback);

        // Remove window listener if no more subscribers
        if (listeners.size === 0) {
          try {
            window.removeEventListener("storage", handleStorageEvent);
          } catch {
            // Ignore cleanup errors
          }
        }
      };
    },
  };
}

/**
 * Creates a no-op adapter for SSR environments.
 * All operations are safe but have no effect.
 */
function createNoopAdapter(): StorageAdapter {
  let hasWarned = false;

  const warnOnce = (): void => {
    if (!hasWarned && isDev()) {
      console.warn(
        "[nanostores-storage] Storage operations called in SSR environment. " +
          "Data will not be persisted. This is expected during server-side rendering.",
      );
      hasWarned = true;
    }
  };

  return {
    get(): string | null {
      warnOnce();
      return null;
    },
    set(): void {
      warnOnce();
    },
    remove(): void {
      warnOnce();
    },
    getAll(): Record<string, string> {
      warnOnce();
      return {};
    },
    setAll(): void {
      warnOnce();
    },
    clear(): void {
      warnOnce();
    },
    subscribe(): () => void {
      return () => {
        // No-op unsubscribe
      };
    },
  };
}

/**
 * Creates a lazy Web Storage adapter that defers Storage access until runtime.
 * This allows the adapter to be safely imported in SSR environments.
 *
 * In SSR environments (Node.js), operations are no-ops that return null/empty values.
 * In browser environments, operations work normally with the Web Storage API.
 */
export function createLazyWebStorageAdapter(getStorage: () => Storage): StorageAdapter {
  let adapter: StorageAdapter | null = null;

  const getAdapter = (): StorageAdapter => {
    if (adapter === null) {
      if (isBrowser()) {
        adapter = createWebStorageAdapter(getStorage());
      } else {
        adapter = createNoopAdapter();
      }
    }
    return adapter;
  };

  return {
    get(key: string): string | null {
      return getAdapter().get(key);
    },

    set(key: string, value: string): void {
      getAdapter().set(key, value);
    },

    remove(key: string): void {
      getAdapter().remove(key);
    },

    getAll(): Record<string, string> {
      return getAdapter().getAll();
    },

    setAll(values: Record<string, string>): void {
      getAdapter().setAll(values);
    },

    clear(): void {
      getAdapter().clear();
    },

    subscribe(callback: (key: string | null) => void): () => void {
      return getAdapter().subscribe(callback);
    },
  };
}
