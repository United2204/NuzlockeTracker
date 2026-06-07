import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // En dev, activa el SW para poder probar el comportamiento offline
      devOptions: { enabled: false },
      workbox: {
        // Precachea todos los assets del build (app shell)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Cache runtime para respuestas de la API
        runtimeCaching: [
          {
            // GET /api/** — NetworkFirst: intenta la red, cae al cache si hay error
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Sprites de Pokémon — CacheFirst: raramente cambian
            urlPattern: ({ url }) =>
              url.pathname.includes('/sprites/') ||
              url.hostname.includes('raw.githubusercontent.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sprites-cache',
              expiration: {
                maxEntries: 1500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      manifest: {
        name: 'NuzlockeTracker',
        short_name: 'NuzlockeTracker',
        description: 'Registrá tus Nuzlocke runs',
        theme_color: '#7c3aed',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/runs',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
});
