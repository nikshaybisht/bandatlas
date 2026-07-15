// Pages needs 404.html = index.html so deep links don't 404 on refresh
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const index = path.join(dist, 'index.html')
const spa404 = path.join(dist, '404.html')
if (!fs.existsSync(index)) {
  console.error('dist/index.html missing — run vite build first')
  process.exit(1)
}
fs.copyFileSync(index, spa404)
console.log('SPA fallback: dist/404.html')
