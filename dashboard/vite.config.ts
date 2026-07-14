import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      'react': fileURLToPath(new URL('./node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@landingpage': fileURLToPath(new URL('../landingpage/src', import.meta.url)),
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        configure: (_proxy) => {
          _proxy.on('error', () => {})
        },
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
      },
      '/s': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
      },
    },
  },
})
