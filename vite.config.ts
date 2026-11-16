import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icons/*.png"],
      manifest: {
        name: "Ninjago Adventure i Älta",
        short_name: "Ninjago",
        description: "Gör uppdrag för att hitta ninjagubbar runt Älta i Nacka.",
        lang: "sv",
        orientation: "portrait",
        display: "standalone",
        start_url: "/",
        scope: "/",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // OSM:s användarpolicy tillåter inte att brickor cachas för offline-bruk.
            // Vi använder alltså bara nätverket, och visar en förenklad karta offline.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  server: {
    host: true,
  },
  preview: {
    // En tunnel skickar med sitt eget värdnamn som Host-header. Sätt
    // TUNNEL_HOST för att tillåta just det, annars blockeras anropen.
    allowedHosts: process.env.TUNNEL_HOST ? [process.env.TUNNEL_HOST] : [],
  },
});
