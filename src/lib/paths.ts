/** Asset URL under Vite `base` (works on GitHub project pages). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const cleaned = path.replace(/^\//, '')
  return `${base}${cleaned}`
}

export function datasetUrl(path: string): string {
  return assetUrl(`dataset/${path.replace(/^\//, '')}`)
}
