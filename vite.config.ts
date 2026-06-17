import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'logo.svg'],
      manifest: {
        name: 'MotoTrack',
        short_name: 'MotoTrack',
        description: 'Real-time group ride tracker for motorcyclists',
        theme_color: '#0c0d13',
        background_color: '#0c0d13',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Activate new service worker immediately — no waiting for tabs to close
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // App shell: always try network first so deploys are picked up fast
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 } }
          },
          {
            urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'carto-tiles', expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 } }
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/styles\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'mapbox-tiles', expiration: { maxEntries: 1000, maxAgeSeconds: 7 * 24 * 60 * 60 } }
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather-api', expiration: { maxEntries: 10, maxAgeSeconds: 30 * 60 } }
          }
        ]
      }
    })
  ]
})
