import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the service worker ourselves via the
      // virtual:pwa-register/react hook (see hooks/usePwaUpdate.js) so we
      // can show our own "update available" toast instead of the
      // plugin's silent auto-reload.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Money Mind',
        short_name: 'Money Mind',
        description: 'Personal financial management, planning and education platform.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0F1113',
        background_color: '#000000',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The looping background videos (some 20-50+MB) must never be
        // precached — that alone would make install/update downloads
        // enormous. Only the app shell (JS/CSS/HTML) and small static
        // images get precached; videos are handled by the runtimeCaching
        // rule below instead, fetched from the network on first use.
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        globIgnores: ['**/videos/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/videos\//],
        runtimeCaching: [
          // Firebase Auth / Firestore / any Google API call — always hit
          // the network. Auth state and financial data must never be
          // served stale from a cache.
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('googleapis.com') ||
              url.hostname.endsWith('firebaseio.com') ||
              url.hostname.endsWith('firebaseapp.com') ||
              url.hostname.endsWith('gstatic.com'),
            handler: 'NetworkOnly',
          },
          // Live currency exchange rates — always fresh; useCurrency's own
          // localStorage cache already handles the offline fallback.
          {
            urlPattern: ({ url }) => url.hostname === 'open.er-api.com',
            handler: 'NetworkOnly',
          },
          // Background videos: runtime-cached (not precached), small cap
          // so switching between a few themes doesn't fill device storage.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/videos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'money-mind-videos',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          // App icons, logo, and other static images.
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && !url.pathname.startsWith('/videos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'money-mind-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fonts.
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'money-mind-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
