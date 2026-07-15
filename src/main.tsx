import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './context/AppThemeContext'
import { DemoTourProvider } from './context/DemoTourContext'
import { AboutPage } from './pages/AboutPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { GuidePage } from './pages/GuidePage'

/** Vite BASE_URL is e.g. `/` or `/bandatlas/` — Router wants no trailing slash (except root). */
function routerBasename(): string | undefined {
  const raw = import.meta.env.BASE_URL || '/'
  if (raw === '/') return undefined
  return raw.replace(/\/$/, '')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <BrowserRouter basename={routerBasename()}>
        <DemoTourProvider>
          <Routes>
            <Route element={<App />}>
              <Route index element={<ExplorerPage />} />
              <Route path="c/:compoundId" element={<ExplorerPage />} />
              <Route path="lab" element={<ExplorerPage preset="lab" />} />
              <Route path="guide" element={<GuidePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DemoTourProvider>
      </BrowserRouter>
    </AppThemeProvider>
  </StrictMode>,
)
