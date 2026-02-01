/**
 * Memory storage adapter.
 * Stores data in JavaScript memory. Data is lost on page refresh.
 *
 * Use cases:
 * - Testing: Isolated storage for each test
 * - SSR: Server-side rendering where browser APIs aren't available
 * - Demos: Interactive examples without polluting real storage
 *
 * Note: Memory adapter cannot detect external changes (each tab has its own
 * JavaScript context). The subscribe method is a no-op. Use .sync() with
 * setInterval if polling is needed.
 */

import type { StorageAdapter } from "../types";

import { noop } from "../utils/noop";

/**
 * Creates an in-memory storage adapter.
 *
 * @param initialData - Optional initial data to populate the storage
 * @returns A StorageAdapter backed by a Map
 *
 * @example
 * ```typescript
 * import { createStorageStore, createMemoryAdapter } from "@vp-tw/nanostores-storage";
 *
 * const memoryAdapter = createMemoryAdapter();
 * const store = createStorageStore(memoryAdapter, "test-key");
 *
 * store.set("value");
 * console.log(store.get()); // "value"
 *
 * // With initial data
 * const preloadedAdapter = createMemoryAdapter({
 *   theme: "dark",
 *   language: "en",
 * });
 * ```
 */
export function createMemoryAdapter(initialData?: Record<string, string>): StorageAdapter {
  const storage = new Map<string, string>(initialData ? Object.entries(initialData) : []);

  return {
    get(key: string): string | null {
      return storage.get(key) ?? null;
    },

    set(key: string, value: string): void {
      storage.set(key, value);
    },

    remove(key: string): void {
      storage.delete(key);
    },

    getAll(): Record<string, string> {
      return Object.fromEntries(storage);
    },

    setAll(values: Record<string, string>): void {
      storage.clear();
      for (const [key, value] of Object.entries(values)) {
        storage.set(key, value);
      }
    },

    clear(): void {
      storage.clear();
    },

    subscribe(): () => void {
      // Memory adapter cannot detect external changes.
      // Use .sync() with setInterval if polling is needed.
      return noop;
    },
  };
}
