---
"@vp-tw/nanostores-storage": minor
---

Initial release of nanostores-storage library

Features:
- `createStorageStore` - Reactive store bound to a single storage key
- `createStorageValuesStore` - Reactive store for entire storage contents
- Built-in adapters: localStorage, sessionStorage, memory
- Fallback chain support for multiple adapters
- Cross-tab synchronization via storage events
- SSR-safe with lazy adapter initialization
- Comprehensive error handling with dev warnings
- Full TypeScript support
