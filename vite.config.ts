import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Базовый путь деплоя. На GitHub Pages это подпапка /pwa-ci/, на своём домене — '/'.
// scope и start_url манифеста ОБЯЗАНЫ совпадать с base, иначе установка PWA не работает.
const BASE = process.env.VITE_BASE || '/pwa-ci/'

export default defineConfig({
  // Дата сборки была вписана строкой и устаревала — подставляем настоящую
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ДБО Центр-инвест',
        short_name: 'Центр-инвест',
        description: 'Интернет-банк для бизнеса: счета, платежи, выписки',
        lang: 'ru',
        dir: 'ltr',
        // Цвета из брендбука v1.0.1
        theme_color: '#50B848',
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: BASE,
        start_url: BASE,
        orientation: 'portrait-primary',
        // Пути относительные — резолвятся от расположения манифеста, работает и в подпапке
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['finance', 'business'],
        // Без screenshots Chrome показывает урезанное окно установки.
        // Файлы генерирует scripts/gen-screenshots.mjs.
        screenshots: [
          {
            src: 'screenshot-mobile.png',
            sizes: '786x1704',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Главный экран: счета и последние операции'
          },
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'ДБО Центр-инвест на большом экране'
          }
        ],
        // Быстрые действия по долгому нажатию на иконку (Android)
        shortcuts: [
          { name: 'Новый платёж',  short_name: 'Платёж',   url: 'payments/create' },
          { name: 'Счета',         short_name: 'Счета',    url: 'accounts' },
          { name: 'Выписка',       short_name: 'Выписка',  url: 'statements' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Deep-link'и SPA (/payments/123) отдаём из index.html
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Данные банка идут через прокси. Кэшируем только чтение и ненадолго:
            // офлайн покажем последние известные счета/платежи, но не устаревшие сутками.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && /\/api\/(accounts|payments|contractors|tariffs|templates)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dbo-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: false
  }
})
