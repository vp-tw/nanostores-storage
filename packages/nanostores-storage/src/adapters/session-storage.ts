/**
 * sessionStorage adapter.
 * Provides session-scoped storage (per-tab isolation).
 * Supports SSR by deferring sessionStorage access until runtime.
 */

import type { StorageAdapter } from "../types";
import { createLazyWebStorageAdapter } from "./web-storage";

/**
 * Pre-configured sessionStorage adapter instance.
 * Note: sessionStorage doesn't fire storage events across tabs,
 * only within the same tab context.
 * Safe to import in SSR environments - sessionStorage is only accessed at runtime.
 */
export const sessionStorageAdapter: StorageAdapter = createLazyWebStorageAdapter(
  () => sessionStorage,
);
