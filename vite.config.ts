import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'

let version = 'dev'
try {
  const pkg = execSync('node -p "require(\'./package.json\').version"', { encoding: 'utf-8' }).trim()
  const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  version = `v${pkg}-${hash}`
} catch {
  version = 'dev'
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
  },
})
