import type { StorageValuesStore } from "@vp-tw/nanostores-storage";
import type { TabItem } from "./demo";
import { useStore } from "@nanostores/react";
import {
  createStorageValuesStore,
  localStorageAdapter,
  sessionStorageAdapter,
} from "@vp-tw/nanostores-storage";
import { Database, Plus, RefreshCw, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "./Button";
import {
  Badge,
  DemoContainer,
  DemoEmpty,
  DemoInfo,
  DemoInput,
  DemoLabel,
  DemoRow,
  DemoRowBetween,
  DemoStack,
  DemoTabs,
  DemoTitle,
  IconButton,
  KeyCell,
  StorageTable,
  ValueCell,
} from "./demo";

type StorageType = "localStorage" | "sessionStorage";

const StorageRow: React.FC<{
  storageKey: string;
  value: string;
  onUpdate: (value: string) => void;
  onDelete: () => void;
}> = ({ storageKey, value, onUpdate, onDelete }) => {
  return (
    <tr>
      <KeyCell>{storageKey}</KeyCell>
      <ValueCell>
        <DemoInput
          type="text"
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}
        />
      </ValueCell>
      <td className="action-cell">
        <IconButton icon={Trash2} onClick={onDelete} title="Delete" variant="danger" />
      </td>
    </tr>
  );
};

const tabs: Array<TabItem<StorageType>> = [
  { key: "localStorage", label: "localStorage" },
  { key: "sessionStorage", label: "sessionStorage" },
];

const StorageValuesView: React.FC<{
  activeTab: StorageType;
  setActiveTab: (tab: StorageType) => void;
  store: StorageValuesStore;
}> = ({ activeTab, setActiveTab, store }) => {
  const values = useStore(store.$value);
  const isListening = useStore(store.listener.$on);

  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  const addEntry = React.useCallback(() => {
    const trimmedKey = newKey.trim();
    const trimmedValue = newValue.trim();
    if (!trimmedKey) return;

    store.set(trimmedKey, trimmedValue);
    setNewKey("");
    setNewValue("");
  }, [newKey, newValue, store]);

  const deleteKey = React.useCallback(
    (key: string) => {
      store.remove(key);
    },
    [store],
  );

  const clearAll = React.useCallback(() => {
    store.clear();
  }, [store]);

  const toggleListener = React.useCallback(() => {
    if (isListening) {
      store.listener.off();
    } else {
      store.listener.on();
    }
  }, [store, isListening]);

  const entries = Object.entries(values);

  return (
    <DemoStack>
      {/* Tab Selector & Controls */}
      <DemoContainer>
        <DemoTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginBottom: "1rem" }}
        />

        <DemoRowBetween>
          <DemoRow>
            <DemoTitle style={{ margin: 0 }}>{activeTab}</DemoTitle>
            <Badge variant={isListening ? "green" : "gray"}>
              {isListening ? "Listening" : "Paused"}
            </Badge>
          </DemoRow>
          <DemoRow>
            <Button
              onClick={toggleListener}
              className="demo-button-secondary demo-button"
              style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
            >
              {isListening ? "Pause" : "Resume"}
            </Button>
            <Button
              onClick={() => store.sync()}
              className="demo-button-secondary demo-button"
              style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              title="Sync from storage"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </Button>
            <Button
              onClick={clearAll}
              disabled={entries.length === 0}
              className="demo-button demo-button-danger"
              style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </Button>
          </DemoRow>
        </DemoRowBetween>
      </DemoContainer>

      {/* Add Entry Form */}
      <DemoContainer>
        <DemoTitle>Add Entry</DemoTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: "0.75rem",
            alignItems: "end",
          }}
        >
          <div>
            <DemoLabel>Key</DemoLabel>
            <DemoInput
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="my-key"
            />
          </div>
          <div>
            <DemoLabel>Value</DemoLabel>
            <DemoInput
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="my-value"
            />
          </div>
          <Button onClick={addEntry} disabled={!newKey.trim()} className="demo-button">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </DemoContainer>

      {/* Storage Contents */}
      <DemoContainer>
        <DemoTitle badge={{ variant: "gray", children: String(entries.length) }}>
          Contents
        </DemoTitle>

        {entries.length === 0 ? (
          <DemoEmpty
            icon={Database}
            title={`No entries in ${activeTab}`}
            text="Add one above or changes from other tabs will appear automatically."
          />
        ) : (
          <StorageTable headers={["Key", "Value", "Actions"]}>
            {entries.map(([key, value]) => (
              <StorageRow
                key={key}
                storageKey={key}
                value={value}
                onUpdate={(newValue) => store.set(key, newValue)}
                onDelete={() => deleteKey(key)}
              />
            ))}
          </StorageTable>
        )}
      </DemoContainer>

      {/* Info Box */}
      <DemoInfo title="How it works">
        <ul>
          <li>
            This demo uses <code>createStorageValuesStore</code> with <code>listen: true</code>
          </li>
          <li>The store monitors ALL keys in the selected storage</li>
          <li>Changes from other browser tabs will appear automatically</li>
          <li>Try opening this page in another tab and making changes!</li>
        </ul>
      </DemoInfo>
    </DemoStack>
  );
};

export const StorageValuesDemo: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<StorageType>("localStorage");

  const [stores] = React.useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return {
      localStorage: createStorageValuesStore(localStorageAdapter, { listen: true }),
      sessionStorage: createStorageValuesStore(sessionStorageAdapter, { listen: true }),
    };
  });

  if (!stores) {
    return (
      <DemoContainer>
        <DemoEmpty icon={Database} title="Loading..." />
      </DemoContainer>
    );
  }

  return (
    <StorageValuesView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      store={activeTab === "localStorage" ? stores.localStorage : stores.sessionStorage}
    />
  );
};
