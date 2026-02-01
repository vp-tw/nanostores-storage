import type { StorageAdapter } from "@vp-tw/nanostores-storage";
import type { TabItem } from "./demo";
import { useStore } from "@nanostores/react";
import { createStorageStore, createStorageValuesStore } from "@vp-tw/nanostores-storage";
import { Link2, Plus, RefreshCw, Trash2 } from "lucide-react";

import * as React from "react";
import { Button } from "./Button";
import {
  ActionCell,
  DemoContainer,
  DemoEmpty,
  DemoInfo,
  DemoInfoNote,
  DemoInput,
  DemoRow,
  DemoStack,
  DemoTabs,
  DemoText,
  DemoTitle,
  DuplicateWarning,
  GithubSourceLink,
  IconButton,
  KeyCell,
  StorageTable,
  ValueCell,
} from "./demo";

type StoreInstance = ReturnType<typeof createStorageStore>;

const GITHUB_SOURCE_URL =
  "https://github.com/vp-tw/nanostores-storage/blob/main/packages/docs/src/components/QueryStringAdapterDemo.tsx";

type HistoryMode = "push" | "replace";

/**
 * Query String adapter using URLSearchParams and History API.
 * This demonstrates adapter extensibility - for production use,
 * consider @vp-tw/nanostores-qs instead.
 */
function createQueryStringAdapter(options: { mode?: HistoryMode } = {}): StorageAdapter {
  const { mode = "replace" } = options;

  const updateUrl = (params: URLSearchParams): void => {
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    if (mode === "push") {
      window.history.pushState({}, "", newUrl);
    } else {
      window.history.replaceState({}, "", newUrl);
    }
  };

  const getParams = (): URLSearchParams => {
    return new URLSearchParams(window.location.search);
  };

  return {
    get(key: string): string | null {
      return getParams().get(key);
    },

    set(key: string, value: string): void {
      const params = getParams();
      params.set(key, value);
      updateUrl(params);
    },

    remove(key: string): void {
      const params = getParams();
      params.delete(key);
      updateUrl(params);
    },

    getAll(): Record<string, string> {
      const result: Record<string, string> = {};
      for (const [key, value] of getParams().entries()) {
        result[key] = value;
      }
      return result;
    },

    setAll(values: Record<string, string>): void {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(values)) {
        params.set(key, value);
      }
      updateUrl(params);
    },

    clear(): void {
      updateUrl(new URLSearchParams());
    },

    subscribe(callback: (key: string | null) => void): () => void {
      const handler = (): void => {
        callback(null);
      };
      window.addEventListener("popstate", handler);
      return () => {
        window.removeEventListener("popstate", handler);
      };
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
      <KeyCell>{storageKey}</KeyCell>
      <ValueCell>
        <DemoInput
          type="text"
          value={value ?? ""}
          onChange={(e) => store.set(e.target.value)}
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}
        />
      </ValueCell>
      <ActionCell>
        <IconButton icon={RefreshCw} onClick={() => store.sync()} title="Sync from URL" />
        <IconButton icon={Trash2} onClick={onDelete} title="Delete" variant="danger" />
      </ActionCell>
    </tr>
  );
};

const modeTabs: Array<TabItem<HistoryMode>> = [
  { key: "push", label: "pushState" },
  { key: "replace", label: "replaceState" },
];

const QueryStringAdapterDemoView: React.FC<{
  adapter: StorageAdapter;
  monitor: ReturnType<typeof createStorageValuesStore>;
  mode: HistoryMode;
  onModeChange: (mode: HistoryMode) => void;
}> = ({ adapter, monitor, mode, onModeChange }) => {
  const [newKey, setNewKey] = React.useState("");

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

  const values = useStore(monitor.$value);
  const keys = Object.keys(values);

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

  const addKey = React.useCallback(() => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey || keys.includes(trimmedKey)) return;

    monitor.set(trimmedKey, "");
    setNewKey("");
  }, [newKey, keys, monitor]);

  const deleteKey = React.useCallback(
    (key: string) => {
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
    <DemoStack>
      <DemoContainer>
        <DemoTitle icon={Link2} badge={{ variant: "purple", children: "Live" }}>
          Query String Adapter Demo
        </DemoTitle>
        <DemoText style={{ marginBottom: "1rem" }}>
          Each row is managed by a <code>createStorageStore</code> instance with a query string
          adapter. Watch the URL change as you edit values!
        </DemoText>

        {/* Mode Toggle */}
        <DemoRow style={{ marginBottom: "1rem" }}>
          <DemoText>History Mode:</DemoText>
          <DemoTabs tabs={modeTabs} activeTab={mode} onTabChange={onModeChange} />
        </DemoRow>

        {/* Add Key Form */}
        <DemoRow style={{ marginBottom: "1rem" }}>
          <DemoInput
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder="new-param-name"
            style={{ flex: 1 }}
          />
          <Button onClick={addKey} disabled={!newKey.trim() || isDuplicate} className="demo-button">
            <Plus className="w-4 h-4" />
            Add Param
          </Button>
        </DemoRow>
        <DuplicateWarning
          show={isDuplicate && !!newKey.trim()}
          message="Parameter already exists"
        />

        {/* Table */}
        {keys.length === 0 ? (
          <DemoEmpty
            icon={Link2}
            title="No query parameters"
            text="Add a parameter above to see it in the URL."
            style={{ padding: "2rem" }}
          />
        ) : (
          <StorageTable headers={["Name", "Value", "Actions"]}>
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
          </StorageTable>
        )}
      </DemoContainer>

      {/* Info Box */}
      <DemoInfo title="About Query String Adapter">
        <ul>
          <li>
            <strong>pushState</strong> creates browser history entries (back button works)
          </li>
          <li>
            <strong>replaceState</strong> updates URL without history (cleaner for frequent updates)
          </li>
          <li>
            <strong>popstate</strong> event fires on back/forward navigation, triggering sync
          </li>
          <li>URL length limits apply (~2000 chars recommended max)</li>
          <li>Great for: shareable state, bookmarkable URLs, deep linking</li>
        </ul>
        <DemoInfoNote>
          <strong>Note:</strong> This adapter demonstrates extensibility. For production use,
          consider{" "}
          <a
            href="https://github.com/vp-tw/nanostores-qs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "hsl(45, 70%, 25%)", textDecoration: "underline" }}
          >
            @vp-tw/nanostores-qs
          </a>{" "}
          which provides typed schemas, validation, and more features.
        </DemoInfoNote>
        <GithubSourceLink href={GITHUB_SOURCE_URL} />
      </DemoInfo>
    </DemoStack>
  );
};

const QueryStringAdapterDemoInner: React.FC<{
  mode: HistoryMode;
  onModeChange: (mode: HistoryMode) => void;
}> = ({ mode, onModeChange }) => {
  const [state] = React.useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const adapter = createQueryStringAdapter({ mode });
    return {
      adapter,
      monitor: createStorageValuesStore(adapter, { listen: true }),
    };
  });

  React.useEffect(() => {
    return () => {
      state?.monitor.listener.off();
    };
  }, [state]);

  if (!state) {
    return (
      <DemoContainer>
        <DemoEmpty icon={Link2} title="Loading..." />
      </DemoContainer>
    );
  }

  return (
    <QueryStringAdapterDemoView
      adapter={state.adapter}
      monitor={state.monitor}
      mode={mode}
      onModeChange={onModeChange}
    />
  );
};

export const QueryStringAdapterDemo: React.FC = () => {
  const [mode, setMode] = React.useState<HistoryMode>("replace");

  return <QueryStringAdapterDemoInner key={mode} mode={mode} onModeChange={setMode} />;
};
