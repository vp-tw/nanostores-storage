# nanostores-storage

A powerful integration tool for nanostores with Web Storage APIs.

## Overview

This library provides seamless integration between [nanostores](https://github.com/nanostores/nanostores) and various storage backends (localStorage, sessionStorage, cookies, and memory). It enables reactive state management with automatic persistence and cross-tab synchronization.

## Project Structure

```
packages/
├── nanostores-storage/    # Main library (published as @vp-tw/nanostores-storage)
├── demo/                  # Astro demo site (deployed to GitHub Pages)
│   └── src/pages/
│       ├── index.astro    # Interactive demo
│       └── docs.astro     # Full documentation (source of truth for API spec)
├── utils/                 # Shared utilities (private)
├── dts/                   # TypeScript definitions (private)
├── tsconfig/              # Shared TypeScript configs (private)
└── css-reset/             # CSS reset styles (private)
```

## Documentation

**The authoritative documentation is at `packages/demo/src/pages/docs.astro`.**

When updating API logic, always:

1. Update the implementation in `packages/nanostores-storage/src/`
2. Update `packages/demo/src/pages/docs.astro` if the API surface changed
3. Update this CLAUDE.md if the overview or key behaviors changed

## Core APIs

### createStorageStore(adapter, key, options)

Creates a reactive store bound to a single storage key.

```typescript
interface StorageStoreOptions {
  listen?: boolean; // Auto-listen to storage changes (default: false)
  defaultValue?: string | null; // Fallback value when storage is empty (default: null)
}
```

**Fallback Chain Behavior (when using array of adapters):**

- **Read**: Returns the first non-null value found (in order)
- **Write**: Writes to ALL adapters in the array
- **Listen**: Listens to the FIRST adapter only

**defaultValue Behavior:**

- `defaultValue` is only applied at **initialization** — it is NOT written to storage
- After initialization, the store reflects the actual storage state (including null)

Returns:

- `$value` - ReadableAtom<string | null> (subscribe to changes)
- `get()` - Get current value
- `set(value)` - Set value (only accepts string, use remove() to clear)
- `remove()` - Remove value from storage and reset to null
- `sync()` - Force sync from storage to store (useful when listen: false, or polling same-tab changes)
- `listener` - { on(), off(), $on } for cross-tab sync control

### createStorageValuesStore(adapter, options)

Creates a reactive store for the entire storage contents.

```typescript
interface StorageValuesStoreOptions {
  listen?: boolean; // Auto-listen to storage changes (default: false)
}
```

Returns:

- `$value` - ReadableAtom<Record<string, string>> (subscribe to changes)
- `get()` - Get all values
- `get(key)` - Get single value by key
- `set(key, value)` - Set a single value
- `update(values | fn)` - Update multiple values or with a function
- `remove(key | keys[])` - Remove values
- `clear()` - Clear all values from storage
- `sync()` - Force sync from storage to store
- `listener` - { on(), off(), $on } for cross-tab sync control

## Storage Types

| Type             | Description                                   |
| ---------------- | --------------------------------------------- |
| `localStorage`   | Persistent browser storage, syncs across tabs |
| `sessionStorage` | Session-only storage, per-tab isolation       |
| `cookie`         | Cookie-based storage, sent with requests      |
| `memory`         | In-memory storage, lost on page refresh       |

## Changesets

All changesets should trigger a version bump on `@vp-tw/nanostores-storage`:

```md
---
"@vp-tw/nanostores-storage": patch
---

Your change description here
```

Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes.

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build library
pnpm build

# Run demo site
pnpm dev
```

## Testing

Tests use Vitest with browser mode (Playwright) to test actual browser storage APIs.

## Deployment

- **Library**: Published to GitHub Packages on version bump
- **Demo**: Deployed to GitHub Pages on push to main
