import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
    },
    includeAssets: ['favicon.svg', 'robots.txt', 'icons/*'],
    manifest: {
      name: 'RIKUY',
      short_name: 'RIKUY',
      description: 'Denuncias anónimas, seguras y accesibles en Latinoamérica.',
      theme_color: '#3b82f6',
      icons: [
        {
          src: 'icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })],
});
