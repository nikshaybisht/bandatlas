import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TourOverlay } from './components/TourOverlay'
import { useAppTheme } from './context/AppThemeContext'
import { useDemoTour } from './context/DemoTourContext'
import { APP_VERSION } from './lib/version'
import './App.css'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `app-nav-link${isActive ? ' active' : ''}`

function RouteOutlet() {
  const loc = useLocation()
  return (
    <ErrorBoundary key={loc.pathname}>
      <Outlet />
    </ErrorBoundary>
  )
}

export default function App() {
  const { theme, toggleTheme } = useAppTheme()
  const { startTour, running } = useDemoTour()

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="topbar app-chrome">
          <div className="brand-row">
            <NavLink to="/" className="brand" end>
              <span className="logo">BandAtlas</span>
            </NavLink>
            <nav className="app-nav" aria-label="Primary">
              <NavLink to="/" className={navClass} end>
                Explorer
              </NavLink>
              <NavLink to="/lab" className={navClass}>
                Lab
              </NavLink>
              <NavLink to="/guide" className={navClass}>
                Guide
              </NavLink>
              <NavLink to="/about" className={navClass}>
                About
              </NavLink>
            </nav>
          </div>

          <div className="top-meta chrome-meta">
            <button
              type="button"
              className="ghost tour-btn"
              data-testid="run-60s-tour-nav"
              onClick={startTour}
              disabled={running}
              title="Walk through search, UV, IR, export"
            >
              {running ? 'Tour…' : 'Quick tour'}
            </button>
            <span className="version-chip" title="Application version">
              v{APP_VERSION}
            </span>
            <button
              type="button"
              className="ghost theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        <TourOverlay />
        <RouteOutlet />

        <footer className="footer">
          <span>
            BandAtlas v{APP_VERSION} · MIT · teaching models, not instrument SI ·{' '}
            Bisht, N. (see CITATION.cff)
          </span>
          <span>
            <a
              href="https://github.com/nikshaybisht/bandatlas/blob/main/docs/methodology.md"
              target="_blank"
              rel="noreferrer"
            >
              Methodology
            </a>
            {' · '}
            <a href="https://github.com/nikshaybisht/bandatlas" target="_blank" rel="noreferrer">
              GitHub
            </a>
            {' · '}
            <a href="https://nikshaybisht.github.io/bandatlas/" target="_blank" rel="noreferrer">
              Live
            </a>
          </span>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
