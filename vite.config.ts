import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base MUST match the GitHub Pages subpath: https://<user>.github.io/deutschmeister/
export default defineConfig({
  base: '/deutschmeister/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // M10.3: keep the initial graph (still downloaded on open: dashboard is
        // eager) as parallel, cache-stable chunks — app code changes no longer
        // re-download react/dexie/content. Supabase is NOT here: it is behind a
        // dynamic import in src/sync/supabaseClient.ts and only loads when the
        // env is configured. Route pages are React.lazy chunks in App.tsx.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (/[\\/]src[\\/]content[\\/]/.test(id)) return 'content'
            return undefined
          }
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler|zustand)[\\/]/.test(id)) {
            return 'react-vendor'
          }
          if (id.includes('@remix-run')) return 'react-vendor'
          if (id.includes('dexie')) return 'db-vendor'
          return undefined
        },
      },
    },
  },
})
