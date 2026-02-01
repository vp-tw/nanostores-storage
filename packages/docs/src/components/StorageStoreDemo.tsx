import type { StorageAdapter } from "@vp-tw/nanostores-storage";
import type { TabItem } from "./demo";
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
import {
  ActionCell,
  DemoContainer,
  DemoEmpty,
  DemoInput,
  DemoRow,
  DemoStack,
  DemoTabs,
  DemoText,
  DemoTitle,
  DuplicateWarning,
  IconButton,
  KeyCell,
  StorageTable,
  ValueCell,
} from "./demo";

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
        {supportsListener && (
          <>
            <IconButton
              icon={isListening ? Eye : EyeOff}
              onClick={toggleListener}
              title={
                isListening ? "Listener ON - click to turn off" : "Listener OFF - click to turn on"
              }
              variant={isListening ? "active" : "default"}
            />
            <IconButton icon={RefreshCw} onClick={() => store.sync()} title="Sync from storage" />
          </>
        )}
        <IconButton icon={Trash2} onClick={onDelete} title="Delete" variant="danger" />
      </ActionCell>
    </tr>
  );
};

const tabs: Array<TabItem<AdapterType>> = [
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

  const [stores, setStores] = React.useState<Record<string, StoreInstance>>(() => {
    const initialStores: Record<string, StoreInstance> = {};
    for (const [adapterKey, monitor] of Object.entries(monitors)) {
      for (const key of Object.keys(monitor.$value.get())) {
        const storeKey = `${adapterKey}:${key}`;
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

  const activeMonitor = monitors[activeTab];
  const values = useStore(activeMonitor.$value);
  const keys = Object.keys(values);

  React.useEffect(() => {
    const unsubscribes = Object.entries(monitors).map(([adapterKey, monitor]) =>
      monitor.$value.subscribe((current, oldValue) => {
        const currentKeys = new Set(Object.keys(current));
        const oldKeys = oldValue ? new Set(Object.keys(oldValue)) : new Set<string>();

        for (const key of currentKeys) {
          if (!oldKeys.has(key)) {
            const storeKey = `${adapterKey}:${key}`;
            if (!storesRef.current[storeKey]) {
              const listen = adapterKey !== "memory";
              const store = createStorageStore(adapters[adapterKey as AdapterType], key, {
                listen,
              });
              setStores((prev) => ({ ...prev, [storeKey]: store }));
            }
          }
        }

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

    activeMonitor.set(trimmedKey, "");
    setNewKey("");
  }, [newKey, keys, activeMonitor]);

  const deleteKey = React.useCallback(
    (key: string) => {
      activeMonitor.update((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [activeMonitor],
  );

  const isDuplicate = keys.includes(newKey.trim());

  const tabsWithCount = tabs.map((tab) => ({
    ...tab,
    count: Object.keys(monitors[tab.key].$value.get()).length,
  }));

  return (
    <DemoStack>
      <DemoContainer>
        <DemoTitle badge={{ variant: "green", children: "Live" }}>
          createStorageStore Demo
        </DemoTitle>
        <DemoText style={{ marginBottom: "1rem" }}>
          Each row is managed by a <code>createStorageStore</code> instance. Toggle listeners, call
          sync(), edit values, or delete keys.
        </DemoText>

        {/* Tabs */}
        <DemoTabs
          tabs={tabsWithCount}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginBottom: "1rem" }}
        />

        {/* Add Key Form */}
        <DemoRow style={{ marginBottom: "1rem" }}>
          <DemoInput
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder="new-key"
            style={{ flex: 1 }}
          />
          <Button onClick={addKey} disabled={!newKey.trim() || isDuplicate} className="demo-button">
            <Plus className="w-4 h-4" />
            Add Key
          </Button>
        </DemoRow>
        <DuplicateWarning show={isDuplicate && !!newKey.trim()} message="Key already exists" />

        {/* Table */}
        {keys.length === 0 ? (
          <DemoEmpty icon={Database} title={`${activeTab} is empty`} style={{ padding: "2rem" }} />
        ) : (
          <StorageTable headers={["Key", "Value", "Actions"]}>
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
          </StorageTable>
        )}
      </DemoContainer>
    </DemoStack>
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
      <DemoContainer>
        <DemoEmpty icon={Database} title="Loading..." />
      </DemoContainer>
    );
  }

  return <StorageStoreDemoView adapters={state.adapters} monitors={state.monitors} />;
};
