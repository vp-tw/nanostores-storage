/**
 * Creates a reactive store bound to a single storage key.
 */

import type { ReadableAtom } from "nanostores";
import type {
  AdapterConfig,
  NonEmptyAdapterArray,
  StorageAdapter,
  StorageListener,
  StorageStore,
  StorageStoreOptions,
} from "./types";

import { atom, computed } from "nanostores";

/**
 * Normalizes adapter config to non-empty array.
 */
function normalizeAdapters(config: AdapterConfig): NonEmptyAdapterArray {
  return Array.isArray(config) ? config : [config];
}

/**
 * Reads value from adapters in order, returning first non-null value.
 * Continues to next adapter if one fails (for fallback chain resilience).
 */
function readFromAdapters(adapters: Array<StorageAdapter>, key: string): string | null {
  for (const adapter of adapters) {
    try {
      const value = adapter.get(key);
      if (value !== null) {
        return value;
      }
    } catch {
      // Continue to next adapter on failure
    }
  }
  return null;
}

/**
 * Writes value to all adapters.
 */
function writeToAdapters(adapters: Array<StorageAdapter>, key: string, value: string): void {
  for (const adapter of adapters) {
    adapter.set(key, value);
  }
}

/**
 * Removes value from all adapters.
 */
function removeFromAdapters(adapters: Array<StorageAdapter>, key: string): void {
  for (const adapter of adapters) {
    adapter.remove(key);
  }
}

/**
 * Creates a reactive nanostore bound to a specific storage key.
 *
 * The store automatically syncs with the underlying storage backend(s)
 * and can optionally listen for changes from other tabs/windows.
 *
 * When using an array of adapters:
 * - **Read**: Returns the first non-null value found (in order)
 * - **Write**: Writes to ALL adapters
 * - **Listen**: Listens to the FIRST adapter only
 *
 * @param adapter - Storage adapter or array of adapters for fallback chain
 * @param key - The storage key to bind to
 * @param options - Configuration options
 * @returns A StorageStore instance
 *
 * @example
 * ```typescript
 * import { createStorageStore, localStorageAdapter, sessionStorageAdapter } from "@vp-tw/nanostores-storage";
 *
 * // Single adapter
 * const userStore = createStorageStore(localStorageAdapter, "user-name", {
 *   defaultValue: "Guest",
 *   listen: true,
 * });
 *
 * // Fallback chain: sessionStorage first, localStorage as fallback
 * const sessionStore = createStorageStore(
 *   [sessionStorageAdapter, localStorageAdapter],
 *   "session-data",
 *   { listen: true }
 * );
 *
 * // Read current value
 * const name = userStore.get();
 *
 * // Update value (writes to all adapters in the chain)
 * userStore.set("Alice");
 *
 * // Remove from storage (resets to null)
 * userStore.remove();
 *
 * // Force sync from storage (useful when listen: false)
 * userStore.sync();
 *
 * // Control listener
 * userStore.listener.on();
 * console.log("Listening:", userStore.listener.$on.get());
 * userStore.listener.off();
 * ```
 */
export function createStorageStore(
  adapter: AdapterConfig,
  key: string,
  options: StorageStoreOptions = {},
): StorageStore {
  const { listen = false, defaultValue = null } = options;

  const adapters = normalizeAdapters(adapter);

  // Initialize internal store with current storage value or defaultValue
  // Note: defaultValue is only used at initialization, NOT written to storage.
  // After initialization, the store reflects the actual storage state (including null).
  //
  // If you need a fallback that always applies when value is null, use computed():
  //   import { computed } from "nanostores";
  //   const $valueWithFallback = computed($value, (v) => v ?? "fallback");
  const currentValue = readFromAdapters(adapters, key);
  const $internalStore = atom<string | null>(currentValue ?? defaultValue);

  // External read-only atom
  const $value: ReadableAtom<string | null> = computed($internalStore, (v) => v);

  // Track cleanup functions for storage subscriptions
  const unsubscribeFns: Array<() => void> = [];

  // Atom to track listener state
  const $on = atom<boolean>(false);

  // Flag to prevent sync loop during internal operations
  let isInternalUpdate = false;

  /**
   * Gets the current value.
   */
  const get = (): string | null => $internalStore.get();

  /**
   * Sets a value (writes to all adapters in the chain).
   */
  const set = (value: string): void => {
    $internalStore.set(value);
  };

  /**
   * Removes the value from all storages and resets to null.
   */
  const remove = (): void => {
    removeFromAdapters(adapters, key);
    try {
      isInternalUpdate = true;
      $internalStore.set(null);
    } finally {
      isInternalUpdate = false;
    }
  };

  /**
   * Force sync from storage to store.
   * Does not apply defaultValue - reflects actual storage state.
   */
  const sync = (): void => {
    const newValue = readFromAdapters(adapters, key);
    // Skip if value hasn't changed (avoid unnecessary notifications)
    if (newValue === $internalStore.get()) return;
    try {
      isInternalUpdate = true;
      $internalStore.set(newValue);
    } finally {
      isInternalUpdate = false;
    }
  };

  // Sync store changes to storage
  // Use listen() instead of subscribe() to skip the immediate first call
  $internalStore.listen((value) => {
    // Skip sync during internal operations (remove, external storage events)
    if (isInternalUpdate) return;

    const storageValue = readFromAdapters(adapters, key);

    // Only write to storage if value is different
    // Note: value is guaranteed to be string here since set() only accepts string
    // and null paths (remove/sync) use isInternalUpdate flag, but we keep the
    // null check for TypeScript type narrowing
    if (value !== null && value !== storageValue) {
      writeToAdapters(adapters, key, value);
    }
  });

  /**
   * Starts listening to storage changes from the first adapter only.
   * In fallback chains, only the primary adapter triggers updates.
   */
  const on = (): void => {
    if ($on.get()) return; // Already started

    const unsubscribe = adapters[0].subscribe((changedKey) => {
      // Only react to changes for our key (or bulk changes)
      if (changedKey === null || changedKey === key) {
        sync();
      }
    });
    unsubscribeFns.push(unsubscribe);

    $on.set(true);
  };

  /**
   * Stops listening to storage changes.
   */
  const off = (): void => {
    for (const unsubscribe of unsubscribeFns) {
      unsubscribe();
    }
    unsubscribeFns.length = 0;
    $on.set(false);
  };

  /**
   * Toggles the listening state.
   */
  const toggle = (): void => {
    if ($on.get()) {
      off();
    } else {
      on();
    }
  };

  // Create listener object
  const listener: StorageListener = {
    on,
    off,
    toggle,
    $on,
  };

  // Start listening if listen option is enabled
  if (listen) {
    listener.on();
  }

  return {
    $value,
    get,
    set,
    remove,
    sync,
    listener,
  };
}
