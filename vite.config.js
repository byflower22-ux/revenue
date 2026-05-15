import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import docCenterPlugin from './vite-plugin-doc-center'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), docCenterPlugin()],
  base: '/revenue/',
})
