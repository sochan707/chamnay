import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(projectRoot, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
