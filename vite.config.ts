import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Default local / CI / e2e: base '/'
// GitHub Pages project site: set VITE_BASE=/bandatlas/ in the Pages workflow only.
// Do NOT key off GITHUB_ACTIONS — that is true for all Actions jobs (including e2e),
// and vite preview re-reads this config, which previously broke smoke tests at /.
const base = process.env.VITE_BASE || '/'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
