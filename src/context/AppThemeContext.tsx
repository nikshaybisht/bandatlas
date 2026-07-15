import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, type Theme } from '../lib/theme'

type AppThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider')
  return ctx
}
