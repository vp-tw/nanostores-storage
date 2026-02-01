import type { StorageAdapter } from "@vp-tw/nanostores-storage";
import { useStore } from "@nanostores/react";
import {
  createMemoryAdapter,
  createStorageStore,
  createStorageValuesStore,
  localStorageAdapter,
  sessionStorageAdapter,
} from "@vp-tw/nanostores-storage";
import { Database, Eye, EyeOff, Plus, RefreshCw, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "./Button";

type AdapterType = "localStorage" | "sessionStorage" | "memory";

type StoreInstance = ReturnType<typeof createStorageStore>;

const StoreRow: React.FC<{
  storageKey: string;
  store: StoreInstance;
  adapterType: AdapterType;
  onDelete: () => void;
}> = ({ storageKey, store, adapterType, onDelete }) => {
  const value = useStore(store.$value);
  const isListening = useStore(store.listener.$on);

  // Memory adapter doesn't support cross-tab listening
  const supportsListener = adapterType !== "memory";

  const toggleListener = () => {
    if (isListening) {
      store.listener.off();
    } else {
      store.listener.on();
    }
  };

  return (
    <tr>
      <td className="key-cell">{storageKey}</td>
      <td className="value-cell">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => store.set(e.target.value)}
          className="demo-input"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}
        />
      </td>
      <td className="action-cell">
        <div className="demo-row">
          {supportsListener && (
            <>
              <Button
                onClick={toggleListener}
                className={`demo-icon-button ${isListening ? "active" : ""}`}
                title={
                  isListening
                    ? "Listener ON - click to turn off"
                    : "Listener OFF - click to turn on"
                }
              >
                {isListening ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => store.sync()}
                className="demo-icon-button"
                title="Sync from storage"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button onClick={onDelete} className="demo-icon-button danger" title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

const tabs: Array<{
  key: AdapterType;
  label: React.ReactNode;
}> = [
  { key: "localStorage", label: "localStorage" },
  { key: "sessionStorage", label: "sessionStorage" },
  { key: "memory", label: "memory" },
];

const StorageStoreDemoView: React.FC<{
  adapters: Record<AdapterType, StorageAdapter>;
  monitors: Record<AdapterType, ReturnType<typeof createStorageValuesStore>>;
}> = ({ adapters, monitors }) => {
  const [activeTab, setActiveTab] = React.useState<AdapterType>("localStorage");
  const [newKey, setNewKey] = React.useState("");

  // Store instances for each adapter/key combination
  const [stores, setStores] = React.useState<Record<string, StoreInstance>>(() => {
    // Initialize stores for existing keys on mount
    const initialStores: Record<string, StoreInstance> = {};
    for (const [adapterKey, monitor] of Object.entries(monitors)) {
      for (const key of Object.keys(monitor.$value.get())) {
        const storeKey = `${adapterKey}:${key}`;
        // Memory adapter doesn't support cross-tab listening
        const listen = adapterKey !== "memory";
        initialStores[storeKey] = createStorageStore(adapters[adapterKey as AdapterType], key, {
          listen,
        });
      }
    }
    return initialStores;
  });

  const storesRef = React.useRef(stores);
  React.useEffect(() => {
    storesRef.current = stores;
  }, [stores]);

  // Subscribe to the active monitor's values
  const activeMonitor = monitors[activeTab];
  const values = useStore(activeMonitor.$value);

  const keys = Object.keys(values);

  // Create stores for new keys, cleanup stores for removed keys
  React.useEffect(() => {
    const unsubscribes = Object.entries(monitors).map(([adapterKey, monitor]) =>
      monitor.$value.subscribe((current, oldValue) => {
        const currentKeys = new Set(Object.keys(current));
        const oldKeys = oldValue ? new Set(Object.keys(oldValue)) : new Set<string>();

        // Create stores for new keys
        for (const key of currentKeys) {
          if (!oldKeys.has(key)) {
            const storeKey = `${adapterKey}:${key}`;
            if (!storesRef.current[storeKey]) {
              // Memory adapter doesn't support cross-tab listening
              const listen = adapterKey !== "memory";
              const store = createStorageStore(adapters[adapterKey as AdapterType], key, {
                listen,
              });
              setStores((prev) => ({ ...prev, [storeKey]: store }));
            }
          }
        }

        // Cleanup stores for removed keys
        for (const key of oldKeys) {
          if (!currentKeys.has(key)) {
            const storeKey = `${adapterKey}:${key}`;
            const store = storesRef.current[storeKey];
            if (store) {
              store.listener.off();
              setStores((prev) => {
                const next = { ...prev };
                delete next[storeKey];
                return next;
              });
            }
          }
        }
      }),
    );

    return () => unsubscribes.forEach((fn) => fn());
  }, [monitors, adapters]);

  const addKey = React.useCallback(() => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey || keys.includes(trimmedKey)) return;

    // Set empty string to create the key
    activeMonitor.set(trimmedKey, "");
    setNewKey("");
  }, [newKey, keys, activeMonitor]);

  const deleteKey = React.useCallback(
    (key: string) => {
      // Use update to delete the key - cleanup handled by subscribe
      activeMonitor.update((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [activeMonitor],
  );

  const isDuplicate = keys.includes(newKey.trim());

  return (
    <div className="demo-stack">
      <div className="demo-container">
        <h3 className="demo-title">
          createStorageStore Demo
          <span className="badge badge-green">Live</span>
        </h3>
        <p className="demo-text" style={{ marginBottom: "1rem" }}>
          Each row is managed by a <code>createStorageStore</code> instance. Toggle listeners, call
          sync(), edit values, or delete keys.
        </p>

        {/* Tabs */}
        <div className="demo-tabs" style={{ marginBottom: "1rem" }}>
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`demo-tab ${activeTab === tab.key ? "active" : ""}`}
            >
              {tab.label}
              <span className="demo-tab-count">
                {Object.keys(monitors[tab.key].$value.get()).length}
              </span>
            </Button>
          ))}
        </div>

        {/* Add Key Form */}
        <div className="demo-row" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder="new-key"
            className="demo-input"
            style={{ flex: 1 }}
          />
          <Button onClick={addKey} disabled={!newKey.trim() || isDuplicate} className="demo-button">
            <Plus className="w-4 h-4" />
            Add Key
          </Button>
        </div>
        {isDuplicate && newKey.trim() && (
          <p className="demo-text-sm" style={{ color: "hsl(0, 72%, 60%)", marginBottom: "1rem" }}>
            Key already exists
          </p>
        )}

        {/* Table */}
        {keys.length === 0 ? (
          <div className="demo-empty" style={{ padding: "2rem" }}>
            <Database className="demo-empty-icon" />
            <p className="demo-empty-title">{activeTab} is empty</p>
          </div>
        ) : (
          <table className="storage-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th className="action-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const storeKey = `${activeTab}:${key}`;
                const store = stores[storeKey];
                if (!store) return null;
                return (
                  <StoreRow
                    key={key}
                    storageKey={key}
                    store={store}
                    adapterType={activeTab}
                    onDelete={() => deleteKey(key)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const StorageStoreDemo: React.FC = () => {
  const [state] = React.useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const memoryAdapter = createMemoryAdapter();
    return {
      adapters: {
        localStorage: localStorageAdapter,
        sessionStorage: sessionStorageAdapter,
        memory: memoryAdapter,
      },
      monitors: {
        localStorage: createStorageValuesStore(localStorageAdapter, { listen: true }),
        sessionStorage: createStorageValuesStore(sessionStorageAdapter, { listen: true }),
        memory: createStorageValuesStore(memoryAdapter),
      },
    };
  });

  if (!state) {
    return (
      <div className="demo-container">
        <div className="demo-empty">
          <Database className="demo-empty-icon" />
          <p className="demo-empty-title">Loading...</p>
        </div>
      </div>
    );
  }

  return <StorageStoreDemoView adapters={state.adapters} monitors={state.monitors} />;
};
