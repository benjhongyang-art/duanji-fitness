import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

const base = (() => {
  const value = process.env.VITE_BASE?.trim() || "/";
  if (value === "/") return "/";
  return value.endsWith("/") ? value : `${value}/`;
})();

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        id: base,
        name: "鍛記",
        short_name: "鍛記",
        description: "把每一次訓練留下來。離線可用的訓練紀錄。",
        lang: "zh-TW",
        dir: "ltr",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#f3f0e8",
        theme_color: "#f3f0e8",
        categories: ["health", "fitness", "lifestyle"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 47321,
  },
  preview: {
    host: "0.0.0.0",
    port: 47321,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
