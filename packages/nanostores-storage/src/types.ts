/**
 * Type definitions for nanostores-storage.
 */

import type { ReadableAtom } from "nanostores";

/**
 * Storage adapter interface.
 * Implement this interface to create custom storage backends.
 *
 * **Important:** This interface is synchronous by design. All methods must
 * return values immediately, not Promises. Async-only storage APIs like
 * IndexedDB are not directly supported.
 *
 * @example
 * ```typescript
 * const myAdapter: StorageAdapter = {
 *   get: (key) => myStorage.getItem(key),
 *   set: (key, value) => myStorage.setItem(key, value),
 *   remove: (key) => myStorage.removeItem(key),
 *   getAll: () => ({ ...myStorage }),
 *   setAll: (values) => { myStorage.clear(); Object.assign(myStorage, values); },
 *   clear: () => myStorage.clear(),
 *   subscribe: (callback) => {
 *     // Set up change listener, return cleanup function
 *     return () => {};
 *   },
 * };
 * ```
 */
export interface StorageAdapter {
  /** Get value by key, returns null if not found */
  get: (key: string) => string | null;

  /** Set value for key */
  set: (key: string, value: string) => void;

  /** Remove value by key */
  remove: (key: string) => void;

  /** Get all key-value pairs */
  getAll: () => Record<string, string>;

  /** Set all values (replaces entire storage) */
  setAll: (values: Record<string, string>) => void;

  /** Clear all values */
  clear: () => void;

  /**
   * Subscribe to storage changes.
   * Returns cleanup function.
   * Callback receives the key that changed (null for bulk changes).
   */
  subscribe: (callback: (key: string | null) => void) => () => void;
}

/**
 * Adapter configuration - single adapter or array for fallback chain.
 *
 * When an array is provided:
 * - **Read**: Returns the first non-null value found (in order)
 * - **Write**: Writes to ALL adapters
 * - **Listen**: Listens to the FIRST adapter only
 *
 * @example
 * ```typescript
 * // Single adapter
 * createStorageStore(localStorageAdapter, "key")
 *
 * // Fallback chain
 * createStorageStore([sessionStorageAdapter, localStorageAdapter], "key")
 * ```
 */
/**
 * Non-empty array of adapters (at least one element guaranteed).
 */
export type NonEmptyAdapterArray = [StorageAdapter, ...Array<StorageAdapter>];

export type AdapterConfig = StorageAdapter | NonEmptyAdapterArray;

/**
 * Listener controller for storage event subscriptions.
 */
export interface StorageListener {
  /** Start listening to storage changes from other tabs/windows */
  on: () => void;

  /** Stop listening to storage changes */
  off: () => void;

  /** Toggle listening state */
  toggle: () => void;

  /** Reactive atom indicating whether listening is active */
  readonly $on: ReadableAtom<boolean>;
}

/**
 * Options for createStorageStore.
 */
export interface StorageStoreOptions {
  /**
   * Whether to automatically listen to storage changes from other tabs/windows.
   * @default false
   */
  listen?: boolean;

  /**
   * Default value used only at initialization when storage is empty.
   * This value is NOT written to storage - it only affects the initial store value.
   * After initialization, the store reflects actual storage state (including null).
   *
   * For a fallback that always applies, use computed():
   * ```typescript
   * import { computed } from "nanostores";
   * const $valueWithFallback = computed(store.$value, (v) => v ?? "fallback");
   * ```
   *
   * @default null
   */
  defaultValue?: string | null;
}

/**
 * Options for createStorageValuesStore.
 */
export interface StorageValuesStoreOptions {
  /**
   * Whether to automatically listen to storage changes from other tabs/windows.
   * @default false
   */
  listen?: boolean;
}

/**
 * Store returned by createStorageStore.
 */
export interface StorageStore {
  /** Reactive atom (read-only, use methods to modify) */
  readonly $value: ReadableAtom<string | null>;

  /** Get current value */
  get: () => string | null;

  /** Set value (writes to all adapters in the chain) */
  set: (value: string) => void;

  /** Remove value from storage and reset to null */
  remove: () => void;

  /** Force sync from storage to store (does not apply defaultValue) */
  sync: () => void;

  /** Listener controller for storage events */
  readonly listener: StorageListener;
}

/**
 * Update function for StorageValuesStore.
 */
export type StorageValuesUpdateFn = (current: Record<string, string>) => Record<string, string>;

/**
 * Store returned by createStorageValuesStore.
 */
export interface StorageValuesStore {
  /** Reactive atom (read-only, use methods to modify) */
  readonly $value: ReadableAtom<Record<string, string>>;

  /** Get all values, or a single value by key */
  get: {
    (): Record<string, string>;
    (key: string): string | null;
  };

  /** Set a single value */
  set: (key: string, value: string) => void;

  /** Update multiple values or use a function to compute new values */
  update: ((values: Record<string, string>) => void) & ((fn: StorageValuesUpdateFn) => void);

  /** Remove one or more values */
  remove: (keyOrKeys: string | Array<string>) => void;

  /** Clear all values from storage */
  clear: () => void;

  /** Force sync from storage to store */
  sync: () => void;

  /** Listener controller for storage events */
  readonly listener: StorageListener;
}
