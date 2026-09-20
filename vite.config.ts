import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base MUST match the GitHub Pages subpath: https://<user>.github.io/deutschmeister/
export default defineConfig({
  base: '/deutschmeister/',
  plugins: [react()],
})
