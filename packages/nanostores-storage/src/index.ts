/**
 * nanostores-storage
 *
 * A powerful integration tool for nanostores with Web Storage APIs.
 * Supports localStorage, sessionStorage, custom adapters, and fallback chains.
 *
 * @packageDocumentation
 */

// Adapters
export {
  createLazyWebStorageAdapter,
  createMemoryAdapter,
  createWebStorageAdapter,
  localStorageAdapter,
  sessionStorageAdapter,
} from "./adapters";

// Main API
export { createStorageStore } from "./create-storage-store";
export { createStorageValuesStore } from "./create-storage-values-store";

// Types
export type {
  AdapterConfig,
  StorageAdapter,
  StorageListener,
  StorageStore,
  StorageStoreOptions,
  StorageValuesStore,
  StorageValuesStoreOptions,
  StorageValuesUpdateFn,
} from "./types";

// Utilities
export { noop } from "./utils/noop";
