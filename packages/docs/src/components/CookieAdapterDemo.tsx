import type { StorageAdapter, StorageStore } from "@vp-tw/nanostores-storage";
import { useStore } from "@nanostores/react";
import { createStorageValuesStore, noop } from "@vp-tw/nanostores-storage";
import Cookies from "js-cookie";
import { Cookie, Plus, RefreshCw, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "./Button";
import {
  ActionCell,
  DemoContainer,
  DemoEmpty,
  DemoInfo,
  DemoInput,
  DemoRow,
  DemoStack,
  DemoText,
  DemoTitle,
  DuplicateWarning,
  GithubSourceLink,
  IconButton,
  KeyCell,
  StorageTable,
  ValueCell,
} from "./demo";
import { useKeyBasedStores } from "./demo/hooks";

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
      const existing = Cookies.get();

      for (const key of Object.keys(existing)) {
        if (!(key in values)) {
          Cookies.remove(key, { path, domain });
        }
      }

      for (const [key, value] of Object.entries(values)) {
        if (existing[key] !== value) {
          Cookies.set(key, value, cookieOptions);
        }
      }
    },

    clear(): void {
      const existing = Cookies.get();
      for (const key of Object.keys(existing)) {
        Cookies.remove(key, { path, domain });
      }
    },

    subscribe(): () => void {
      return noop;
    },
  };
}

const StoreRow: React.FC<{
  storageKey: string;
  store: StorageStore;
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
        <IconButton icon={RefreshCw} onClick={() => store.sync()} title="Sync from storage" />
        <IconButton icon={Trash2} onClick={onDelete} title="Delete" variant="danger" />
      </ActionCell>
    </tr>
  );
};

const CookieAdapterDemoView: React.FC<{
  adapter: StorageAdapter;
  monitor: ReturnType<typeof createStorageValuesStore>;
}> = ({ adapter, monitor }) => {
  const [newKey, setNewKey] = React.useState("");
  const stores = useKeyBasedStores(monitor, adapter);

  const values = useStore(monitor.$value);
  const keys = Object.keys(values);

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
        <DemoTitle icon={Cookie} badge={{ variant: "purple", children: "Live" }}>
          Cookie Adapter Demo
        </DemoTitle>
        <DemoText style={{ marginBottom: "1rem" }}>
          Each row is managed by a <code>createStorageStore</code> instance with a cookie adapter
          using <a href="https://github.com/js-cookie/js-cookie">js-cookie</a>. Edit values, call
          sync() to refresh, or delete keys.
        </DemoText>

        {/* Add Key Form */}
        <DemoRow style={{ marginBottom: "1rem" }}>
          <DemoInput
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder="new-cookie-name"
            style={{ flex: 1 }}
          />
          <Button onClick={addKey} disabled={!newKey.trim() || isDuplicate} className="demo-button">
            <Plus className="w-4 h-4" />
            Add Cookie
          </Button>
        </DemoRow>
        <DuplicateWarning show={isDuplicate && !!newKey.trim()} message="Cookie already exists" />

        {/* Table */}
        {keys.length === 0 ? (
          <DemoEmpty
            icon={Cookie}
            title="No cookies found"
            text="Add a cookie above to see it appear here."
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
      <DemoInfo title="About Cookie Adapter">
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
        <GithubSourceLink href={GITHUB_SOURCE_URL} />
      </DemoInfo>
    </DemoStack>
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
      <DemoContainer>
        <DemoEmpty icon={Cookie} title="Loading..." />
      </DemoContainer>
    );
  }

  return <CookieAdapterDemoView adapter={state.adapter} monitor={state.monitor} />;
};
