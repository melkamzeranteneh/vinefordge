import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'packages/types': '/d/Projects/vinefordge/packages/types/src'
    }
  }
})
