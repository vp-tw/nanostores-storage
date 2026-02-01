import type { StorageValuesStore } from "@vp-tw/nanostores-storage";
import { useStore } from "@nanostores/react";
import {
  createStorageValuesStore,
  localStorageAdapter,
  sessionStorageAdapter,
} from "@vp-tw/nanostores-storage";
import { Database, Plus, RefreshCw, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "./Button";

const StorageRow: React.FC<{
  storageKey: string;
  value: string;
  onUpdate: (value: string) => void;
  onDelete: () => void;
}> = ({ storageKey, value, onUpdate, onDelete }) => {
  return (
    <tr>
      <td className="key-cell">{storageKey}</td>
      <td className="value-cell">
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          className="demo-input"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}
        />
      </td>
      <td className="action-cell">
        <Button onClick={onDelete} className="demo-icon-button danger" title="Delete">
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
};

const StorageValuesView: React.FC<{
  activeTab: "localStorage" | "sessionStorage";
  setActiveTab: (tab: "localStorage" | "sessionStorage") => void;
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
    <div className="demo-stack">
      {/* Tab Selector & Controls */}
      <div className="demo-container">
        <div className="demo-tabs" style={{ marginBottom: "1rem" }}>
          <Button
            onClick={() => setActiveTab("localStorage")}
            className={`demo-tab ${activeTab === "localStorage" ? "active" : ""}`}
          >
            localStorage
          </Button>
          <Button
            onClick={() => setActiveTab("sessionStorage")}
            className={`demo-tab ${activeTab === "sessionStorage" ? "active" : ""}`}
          >
            sessionStorage
          </Button>
        </div>

        <div className="demo-row-between">
          <div className="demo-row">
            <h3 className="demo-title" style={{ margin: 0 }}>
              {activeTab}
            </h3>
            <span className={`badge ${isListening ? "badge-green" : "badge-gray"}`}>
              {isListening ? "Listening" : "Paused"}
            </span>
          </div>
          <div className="demo-row">
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
          </div>
        </div>
      </div>

      {/* Add Entry Form */}
      <div className="demo-container">
        <h3 className="demo-title">Add Entry</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: "0.75rem",
            alignItems: "end",
          }}
        >
          <div>
            <label className="demo-label">Key</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="my-key"
              className="demo-input"
            />
          </div>
          <div>
            <label className="demo-label">Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="my-value"
              className="demo-input"
            />
          </div>
          <Button onClick={addEntry} disabled={!newKey.trim()} className="demo-button">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Storage Contents */}
      <div className="demo-container">
        <h3 className="demo-title">
          Contents
          <span className="badge badge-gray">{entries.length}</span>
        </h3>

        {entries.length === 0 ? (
          <div className="demo-empty">
            <Database className="demo-empty-icon" />
            <p className="demo-empty-title">No entries in {activeTab}</p>
            <p className="demo-empty-text">
              Add one above or changes from other tabs will appear automatically.
            </p>
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
              {entries.map(([key, value]) => (
                <StorageRow
                  key={key}
                  storageKey={key}
                  value={value}
                  onUpdate={(newValue) => store.set(key, newValue)}
                  onDelete={() => deleteKey(key)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="demo-info">
        <h4 className="demo-info-title">How it works</h4>
        <ul>
          <li>
            This demo uses <code>createStorageValuesStore</code> with <code>listen: true</code>
          </li>
          <li>The store monitors ALL keys in the selected storage</li>
          <li>Changes from other browser tabs will appear automatically</li>
          <li>Try opening this page in another tab and making changes!</li>
        </ul>
      </div>
    </div>
  );
};

export const StorageValuesDemo: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<"localStorage" | "sessionStorage">(
    "localStorage",
  );

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
      <div className="demo-container">
        <div className="demo-empty">
          <Database className="demo-empty-icon" />
          <p className="demo-empty-title">Loading...</p>
        </div>
      </div>
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
