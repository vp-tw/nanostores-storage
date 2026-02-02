---
"@vp-tw/nanostores-storage": patch
---

fix: fallback chain now listens to first adapter only

When using an array of adapters (fallback chain), the listener now only subscribes to the first adapter instead of all adapters. This aligns with the primary use case of tab-isolated state with persistent fallback:

- `[sessionStorage, localStorage]`: Only sessionStorage changes trigger updates within the same tab
- New tabs read from localStorage (fallback) but maintain their own session state

Also improved type safety: `AdapterConfig` now requires at least one adapter when using an array.
