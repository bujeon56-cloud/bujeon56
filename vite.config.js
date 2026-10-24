import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Use subpath for GitHub Pages if in GitHub Actions, otherwise root
const base = process.env.GITHUB_ACTIONS ? '/bujeon56/' : './';

export default defineConfig({
  base: base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: './',
        start_url: './',
        scope: './',
        name: '교회 소년부 스마트 출석부',
        short_name: '소년부 출석부',
        description: '교회 소년부 연도별/목장별 실시간 출석 및 달란트 관리 웹앱',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
})
