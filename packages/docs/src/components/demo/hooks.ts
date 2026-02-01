import type { StorageAdapter, StorageStore, StorageValuesStore } from "@vp-tw/nanostores-storage";
import { createStorageStore } from "@vp-tw/nanostores-storage";
import * as React from "react";

/**
 * Hook for managing key-based storage stores.
 * Creates and manages individual StorageStore instances for each key in the monitor.
 * Automatically syncs when keys are added or removed from the monitor.
 */
export function useKeyBasedStores(
  monitor: StorageValuesStore,
  adapter: StorageAdapter,
): Record<string, StorageStore> {
  const [stores, setStores] = React.useState<Record<string, StorageStore>>(() => {
    const initialStores: Record<string, StorageStore> = {};
    for (const key of Object.keys(monitor.$value.get())) {
      initialStores[key] = createStorageStore(adapter, key);
    }
    return initialStores;
  });

  const storesRef = React.useRef(stores);
  React.useEffect(() => {
    storesRef.current = stores;
  }, [stores]);

  React.useEffect(() => {
    const unsubscribe = monitor.$value.subscribe((current, oldValue) => {
      const currentKeys = new Set(Object.keys(current));
      const oldKeys = oldValue ? new Set(Object.keys(oldValue)) : new Set<string>();

      for (const key of currentKeys) {
        if (!oldKeys.has(key)) {
          if (!storesRef.current[key]) {
            const store = createStorageStore(adapter, key);
            setStores((prev) => ({ ...prev, [key]: store }));
          }
        }
      }

      for (const key of oldKeys) {
        if (!currentKeys.has(key)) {
          const store = storesRef.current[key];
          if (store) {
            store.listener.off();
            setStores((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [monitor, adapter]);

  return stores;
}
