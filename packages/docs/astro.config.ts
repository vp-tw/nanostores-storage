import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  base: "/nanostores-storage",
  integrations: [
    starlight({
      title: "nanostores-storage",
      description: "A powerful integration tool for nanostores with Web Storage APIs",
      social: {
        github: "https://github.com/vp-tw/nanostores-storage",
      },
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "guides/introduction" },
            { label: "Installation", slug: "guides/installation" },
            { label: "Quick Start", slug: "guides/quick-start" },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Storage Adapters", slug: "concepts/adapters" },
            { label: "Fallback Chains", slug: "concepts/fallback-chains" },
            { label: "Cross-Tab Sync", slug: "concepts/cross-tab-sync" },
          ],
        },
        {
          label: "API Reference",
          items: [
            { label: "createStorageStore", slug: "api/create-storage-store" },
            { label: "createStorageValuesStore", slug: "api/create-storage-values-store" },
            { label: "createMemoryAdapter", slug: "api/memory-adapter" },
            { label: "StorageAdapter", slug: "api/storage-adapter" },
          ],
        },
        {
          label: "Recipes",
          items: [
            { label: "Custom Adapters", slug: "recipes/custom-adapters" },
            { label: "Cookie Adapter", slug: "recipes/cookie-adapter" },
          ],
        },
        {
          label: "Interactive Demo",
          items: [
            { label: "createStorageStore Demo", slug: "demo/storage-store" },
            { label: "createStorageValuesStore Demo", slug: "demo/storage-values-store" },
          ],
        },
      ],
    }),
    react(),
  ],
});
