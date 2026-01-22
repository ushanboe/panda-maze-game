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
        name: 'Panda Maze Escape',
        short_name: 'PandaMaze',
        description: 'Help the panda escape the bamboo maze!',
        theme_color: '#4a7c59',
        background_color: '#1a1a2e',
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
