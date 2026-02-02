---
"@vp-tw/nanostores-storage": patch
---

fix: `createStorageValuesStore.get(key)` returns `null` instead of `undefined` for non-existent keys

This aligns with Web Storage API behavior (`localStorage.getItem()` returns `null`) and
`createStorageStore.get()` for consistent null-checking.
