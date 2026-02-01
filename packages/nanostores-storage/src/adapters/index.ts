/**
 * Storage adapters module.
 */

export { localStorageAdapter } from "./local-storage";
export { createMemoryAdapter } from "./memory-storage";
export { sessionStorageAdapter } from "./session-storage";
export { createLazyWebStorageAdapter, createWebStorageAdapter } from "./web-storage";
