import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages: https://nikshaybisht.github.io/bandatlas/
// Override: VITE_BASE=/  for root hosting, or VITE_BASE=/bandatlas/ explicitly.
const base =
  process.env.VITE_BASE ??
  (process.env.GITHUB_ACTIONS === 'true' ? '/bandatlas/' : '/')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
