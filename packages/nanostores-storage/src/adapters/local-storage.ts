/**
 * localStorage adapter.
 * Provides persistent storage that syncs across browser tabs.
 * Supports SSR by deferring localStorage access until runtime.
 */

import type { StorageAdapter } from "../types";
import { createLazyWebStorageAdapter } from "./web-storage";

/**
 * Pre-configured localStorage adapter instance.
 * Handles storage events for cross-tab synchronization.
 * Safe to import in SSR environments - localStorage is only accessed at runtime.
 */
export const localStorageAdapter: StorageAdapter = createLazyWebStorageAdapter(() => localStorage);
