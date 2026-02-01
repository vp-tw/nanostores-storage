import type { StorageAdapter } from "@vp-tw/nanostores-storage";
import { useStore } from "@nanostores/react";
import { createStorageStore, createStorageValuesStore, noop } from "@vp-tw/nanostores-storage";
import Cookies from "js-cookie";
import { Cookie, ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "./Button";

type StoreInstance = ReturnType<typeof createStorageStore>;

const GITHUB_SOURCE_URL =
  "https://github.com/vp-tw/nanostores-storage/blob/main/packages/docs/src/components/CookieAdapterDemo.tsx";

/**
 * Cookie adapter using js-cookie.
 * This is the recommended implementation for production use.
 */
function createCookieAdapter(
  options: {
    expires?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {},
): StorageAdapter {
  const { expires = 365, path = "/", domain, secure, sameSite = "lax" } = options;

  const cookieOptions: Cookies.CookieAttributes = {
    expires,
    path,
    domain,
    secure,
    sameSite,
  };

  return {
    get(key: string): string | null {
      return Cookies.get(key) ?? null;
    },

    set(key: string, value: string): void {
      Cookies.set(key, value, cookieOptions);
    },

    remove(key: string): void {
      Cookies.remove(key, { path, domain });
    },

    getAll(): Record<string, string> {
      return (Cookies.get() as Record<string, string>) ?? {};
    },

    setAll(values: Record<string, string>): void {
      // Remove all existing cookies
      const existing = Cookies.get();
      for (const key of Object.keys(existing)) {
        Cookies.remove(key, { path, domain });
      }
      // Set new cookies
      for (const [key, value] of Object.entries(values)) {
        Cookies.set(key, value, cookieOptions);
      }
    },

    clear(): void {
      const existing = Cookies.get();
      for (const key of Object.keys(existing)) {
        Cookies.remove(key, { path, domain });
      }
    },

    // Cookie adapter cannot detect external changes (no cross-tab events).
    // Use .sync() with setInterval if polling is needed.
    subscribe(): () => void {
      return noop;
    },
  };
}

const StoreRow: React.FC<{
  storageKey: string;
  store: StoreInstance;
  onDelete: () => void;
}> = ({ storageKey, store, onDelete }) => {
  const value = useStore(store.$value);

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
          <Button
            onClick={() => store.sync()}
            className="demo-icon-button"
            title="Sync from storage"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={onDelete} className="demo-icon-button danger" title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

const CookieAdapterDemoView: React.FC<{
  adapter: StorageAdapter;
  monitor: ReturnType<typeof createStorageValuesStore>;
}> = ({ adapter, monitor }) => {
  const [newKey, setNewKey] = React.useState("");

  // Store instances for each key - initialize with existing keys
  const [stores, setStores] = React.useState<Record<string, StoreInstance>>(() => {
    const initialStores: Record<string, StoreInstance> = {};
    for (const key of Object.keys(monitor.$value.get())) {
      initialStores[key] = createStorageStore(adapter, key);
    }
    return initialStores;
  });

  const storesRef = React.useRef(stores);
  React.useEffect(() => {
    storesRef.current = stores;
  }, [stores]);

  // Subscribe to the monitor's values
  const values = useStore(monitor.$value);

  const keys = Object.keys(values);

  // Create stores for new keys, cleanup stores for removed keys
  React.useEffect(() => {
    const unsubscribe = monitor.$value.subscribe((current, oldValue) => {
      const currentKeys = new Set(Object.keys(current));
      const oldKeys = oldValue ? new Set(Object.keys(oldValue)) : new Set<string>();

      // Create stores for new keys
      for (const key of currentKeys) {
        if (!oldKeys.has(key)) {
          if (!storesRef.current[key]) {
            const store = createStorageStore(adapter, key);
            setStores((prev) => ({ ...prev, [key]: store }));
          }
        }
      }

      // Cleanup stores for removed keys
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

  const addKey = React.useCallback(() => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey || keys.includes(trimmedKey)) return;

    // Set empty string to create the key
    monitor.set(trimmedKey, "");
    setNewKey("");
  }, [newKey, keys, monitor]);

  const deleteKey = React.useCallback(
    (key: string) => {
      // Use update to delete the key - cleanup handled by subscribe
      monitor.update((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [monitor],
  );

  const isDuplicate = keys.includes(newKey.trim());

  return (
    <div className="demo-stack">
      <div className="demo-container">
        <h3 className="demo-title">
          <Cookie className="w-5 h-5" style={{ marginRight: "0.5rem" }} />
          Cookie Adapter Demo
          <span className="badge badge-purple">Live</span>
        </h3>
        <p className="demo-text" style={{ marginBottom: "1rem" }}>
          Each row is managed by a <code>createStorageStore</code> instance with a cookie adapter
          using <a href="https://github.com/js-cookie/js-cookie">js-cookie</a>. Edit values, call
          sync() to refresh, or delete keys.
        </p>

        {/* Add Key Form */}
        <div className="demo-row" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder="new-cookie-name"
            className="demo-input"
            style={{ flex: 1 }}
          />
          <Button onClick={addKey} disabled={!newKey.trim() || isDuplicate} className="demo-button">
            <Plus className="w-4 h-4" />
            Add Cookie
          </Button>
        </div>
        {isDuplicate && newKey.trim() && (
          <p className="demo-text-sm" style={{ color: "hsl(0, 72%, 60%)", marginBottom: "1rem" }}>
            Cookie already exists
          </p>
        )}

        {/* Table */}
        {keys.length === 0 ? (
          <div className="demo-empty" style={{ padding: "2rem" }}>
            <Cookie className="demo-empty-icon" />
            <p className="demo-empty-title">No cookies found</p>
            <p className="demo-empty-text">Add a cookie above to see it appear here.</p>
          </div>
        ) : (
          <table className="storage-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
                <th className="action-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const store = stores[key];
                if (!store) return null;
                return (
                  <StoreRow
                    key={key}
                    storageKey={key}
                    store={store}
                    onDelete={() => deleteKey(key)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="demo-info">
        <h4 className="demo-info-title">About Cookie Adapter</h4>
        <ul>
          <li>Cookies have a ~4KB size limit per cookie</li>
          <li>Cookies are sent with every HTTP request (use sparingly for bandwidth)</li>
          <li>
            <strong>No cross-tab listening:</strong> Unlike localStorage, cookies don't fire
            cross-tab events. The <code>subscribe</code> method returns a no-op.
          </li>
          <li>
            Use the <strong>Sync</strong> button or call <code>.sync()</code> to refresh after
            external changes. For polling, use <code>setInterval(() =&gt; store.sync(), 1000)</code>
            .
          </li>
          <li>Great for: cross-subdomain sharing, server-side access, legacy systems</li>
        </ul>
        <a
          href={GITHUB_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            marginTop: "0.75rem",
            color: "var(--sl-color-text-accent)",
          }}
        >
          <ExternalLink className="w-4 h-4" />
          View full implementation example
        </a>
      </div>
    </div>
  );
};

export const CookieAdapterDemo: React.FC = () => {
  const [state] = React.useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const adapter = createCookieAdapter({ expires: 7 });
    return {
      adapter,
      monitor: createStorageValuesStore(adapter),
    };
  });

  if (!state) {
    return (
      <div className="demo-container">
        <div className="demo-empty">
          <Cookie className="demo-empty-icon" />
          <p className="demo-empty-title">Loading...</p>
        </div>
      </div>
    );
  }

  return <CookieAdapterDemoView adapter={state.adapter} monitor={state.monitor} />;
};
