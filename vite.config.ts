import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.png",
        "apple-touch-icon.png",
        "offline.html",
        "map/ATTRIBUTION.txt",
      ],
      manifest: {
        name: "RoadTag",
        short_name: "RoadTag",
        description:
          "A local-only license plate spotting game for road trips. No camera, no GPS, no accounts.",
        display: "standalone",
        start_url: "/",
        scope: "/",
        theme_color: "#1f4d3a",
        background_color: "#f4efe6",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,txt}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [],
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.filter((entry) => !entry.url.includes("cdn-cgi")),
            warnings: [],
          }),
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    css: true,
  },
});
