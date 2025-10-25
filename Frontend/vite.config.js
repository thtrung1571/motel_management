import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Target older Safari on iOS 12 and other legacy browsers
      targets: ['defaults', 'iOS >= 12'],
      // Include polyfills for features used by the app when needed
      modernPolyfills: true
    })
  ],
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: true,
  }
})
