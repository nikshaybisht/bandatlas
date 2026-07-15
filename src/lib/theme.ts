export type Theme = 'dark' | 'light'

export const THEME_KEY = 'bandatlas-theme'
export const WELCOME_KEY = 'bandatlas-welcome-dismissed'

export function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.body.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function isWelcomeDismissed(): boolean {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return true
  }
}

export function dismissWelcome(): void {
  try {
    localStorage.setItem(WELCOME_KEY, '1')
  } catch {
    /* ignore */
  }
}
