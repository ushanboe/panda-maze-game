import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Go Panda Run',
        short_name: 'GoPandaRun',
        description: 'Help the panda escape the bamboo maze! A retro arcade game.',
        theme_color: '#4a7c59',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          {
            src: 'panda-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'panda-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  }
})
