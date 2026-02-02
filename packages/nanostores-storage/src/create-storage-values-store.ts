/**
 * Creates a reactive store for monitoring entire storage contents.
 */

import type { ReadableAtom } from "nanostores";
import type {
  StorageAdapter,
  StorageListener,
  StorageValuesStore,
  StorageValuesStoreOptions,
  StorageValuesUpdateFn,
} from "./types";

import { atom, computed } from "nanostores";

import { shallowEqual } from "./utils/shallow-equal";

/**
 * Creates a reactive nanostore that mirrors the entire storage contents.
 *
 * The store provides a Record<string, string> view of all key-value pairs
 * in the storage backend and can optionally listen for changes from
 * other tabs/windows.
 *
 * @param adapter - Storage adapter to use
 * @param options - Configuration options
 * @returns A StorageValuesStore instance
 *
 * @example
 * ```typescript
 * import { createStorageValuesStore, localStorageAdapter } from "@vp-tw/nanostores-storage";
 *
 * const allStorage = createStorageValuesStore(localStorageAdapter, {
 *   listen: true,
 * });
 *
 * // Read all values
 * const values = allStorage.get();
 *
 * // Read single value
 * const name = allStorage.get("user-name");
 *
 * // Set a single value
 * allStorage.set("key", "value");
 *
 * // Update multiple values
 * allStorage.update({ key1: "value1", key2: "value2" });
 *
 * // Update with function
 * allStorage.update((current) => ({
 *   ...current,
 *   timestamp: Date.now().toString(),
 * }));
 *
 * // Remove values
 * allStorage.remove("key1");
 * allStorage.remove(["key1", "key2"]);
 *
 * // Clear all values
 * allStorage.clear();
 *
 * // Force sync from storage (useful when listen: false)
 * allStorage.sync();
 *
 * // Control listener
 * allStorage.listener.on();
 * console.log("Listening:", allStorage.listener.$on.get());
 * allStorage.listener.off();
 * ```
 */
export function createStorageValuesStore(
  adapter: StorageAdapter,
  options: StorageValuesStoreOptions = {},
): StorageValuesStore {
  const { listen = false } = options;

  // Initialize internal store with current storage contents
  const $internalStore = atom<Record<string, string>>(adapter.getAll());

  // External read-only atom
  const $value: ReadableAtom<Record<string, string>> = computed($internalStore, (v) => v);

  // Track cleanup function for storage subscription
  let unsubscribe: (() => void) | null = null;

  // Atom to track listener state
  const $on = atom<boolean>(false);

  // Sync store changes to storage (skip if values are equal)
  $internalStore.subscribe((values) => {
    const storageValues = adapter.getAll();
    if (shallowEqual(values, storageValues)) return;
    adapter.setAll(values);
  });

  /**
   * Internal helper to update store value with shallow equality check.
   */
  const updateValue = (newValue: Record<string, string>): void => {
    if (shallowEqual(newValue, $internalStore.get())) return;
    $internalStore.set(newValue);
  };

  /**
   * Gets all values or a single value by key.
   */
  function get(): Record<string, string>;
  function get(key: string): string | null;
  function get(key?: string): Record<string, string> | string | null {
    if (key === undefined) {
      return $internalStore.get();
    }
    return $internalStore.get()[key] ?? null;
  }

  /**
   * Sets a single value in storage.
   */
  const set = (key: string, value: string): void => {
    const current = $internalStore.get();
    updateValue({ ...current, [key]: value });
  };

  /**
   * Updates multiple values or applies a function to compute new values.
   */
  function update(values: Record<string, string>): void;
  function update(fn: StorageValuesUpdateFn): void;
  function update(valuesOrFn: Record<string, string> | StorageValuesUpdateFn): void {
    const current = $internalStore.get();
    const newValue =
      typeof valuesOrFn === "function" ? valuesOrFn(current) : { ...current, ...valuesOrFn };
    updateValue(newValue);
  }

  /**
   * Removes one or more values from storage.
   */
  const remove = (keyOrKeys: string | Array<string>): void => {
    const current = $internalStore.get();
    const keysToDelete = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    const updated = { ...current };
    for (const k of keysToDelete) {
      delete updated[k];
    }
    updateValue(updated);
  };

  /**
   * Clears all values from storage.
   */
  const clear = (): void => {
    updateValue({});
  };

  /**
   * Force sync from storage to store.
   */
  const sync = (): void => {
    updateValue(adapter.getAll());
  };

  /**
   * Starts listening to storage changes from other sources.
   */
  const on = (): void => {
    if ($on.get()) return; // Already started

    unsubscribe = adapter.subscribe(() => {
      sync();
    });

    $on.set(true);
  };

  /**
   * Stops listening to storage changes.
   */
  const off = (): void => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
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
    update,
    remove,
    clear,
    sync,
    listener,
  };
}
