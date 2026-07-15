/** Local-only recent compounds (privacy-safe, no server). */

export const RECENT_KEY = 'bandatlas-recent-compounds'
export const RECENT_MAX = 10

export type RecentEntry = {
  id: string
  name: string
  formula?: string
  at: number
}

export function readRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e) => e && typeof e.id === 'string' && typeof e.name === 'string')
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

export function pushRecent(entry: { id: string; name: string; formula?: string }): RecentEntry[] {
  const next: RecentEntry[] = [
    { id: entry.id, name: entry.name, formula: entry.formula, at: Date.now() },
    ...readRecent().filter((e) => e.id !== entry.id),
  ].slice(0, RECENT_MAX)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
  return next
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(RECENT_KEY)
  } catch {
    /* ignore */
  }
}
