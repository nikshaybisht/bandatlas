import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemoTour } from '../context/DemoTourContext'
import { datasetUrl } from '../lib/paths'
import { APP_VERSION } from '../lib/version'

type Summary = {
  version: string
  total: number
  full_uvvis: number
  ir: number
  raman: number
  nmr_1h?: number
  nmr_13c?: number
  ms?: number
  catalog_only: number
  lab_set?: number
  lab_set_count?: number
  experimental?: number
  generatedAt?: string
}

export function AboutPage() {
  const { startTour } = useDemoTour()
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(datasetUrl('summary.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Summary | null) => {
        if (!cancelled && data) setSummary(data)
      })
      .catch(() => {
        /* ignore — summary is optional chrome */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="main page-main">
      <article className="page-panel">
        <h1 className="page-h1">About BandAtlas</h1>
        <p className="page-lead">
          Static browser app for small-molecule <strong>UV–Vis</strong>, <strong>IR</strong>, and{' '}
          <strong>Raman</strong> — structures, filters, export to notes.
        </p>

        <section className="skills-panel" data-testid="skills-panel" aria-label="Author and metrics">
          <h2 className="page-h2">Nikshay Bisht</h2>
          <p>
            I built this for teaching and lab discussion. Source:{' '}
            <a href="https://github.com/nikshaybisht/bandatlas" target="_blank" rel="noreferrer">
              github.com/nikshaybisht/bandatlas
            </a>
            .
          </p>
          <ul className="metrics-grid" data-testid="metrics-grid">
            <li>
              <span className="metric-val">{summary?.total ?? '—'}</span>
              <span className="metric-label">compounds</span>
            </li>
            <li>
              <span className="metric-val">{summary?.full_uvvis ?? '—'}</span>
              <span className="metric-label">full UV curves</span>
            </li>
            <li>
              <span className="metric-val">{summary?.nmr_1h ?? '—'}</span>
              <span className="metric-label">¹H NMR teaching</span>
            </li>
            <li>
              <span className="metric-val">{summary?.nmr_13c ?? '—'}</span>
              <span className="metric-label">¹³C NMR teaching</span>
            </li>
            <li>
              <span className="metric-val">{summary?.ms ?? '—'}</span>
              <span className="metric-label">MS teaching</span>
            </li>
            <li>
              <span className="metric-val">
                {summary?.lab_set ?? summary?.lab_set_count ?? '—'}
              </span>
              <span className="metric-label">lab set</span>
            </li>
            <li>
              <span className="metric-val">v{summary?.version || APP_VERSION}</span>
              <span className="metric-label">dataset / app</span>
            </li>
          </ul>
          <p className="page-muted">
            Numbers from <code>dataset/summary.json</code> after <code>npm run dataset</code>.
          </p>
          <button type="button" className="welcome-primary" onClick={startTour}>
            Quick tour
          </button>
        </section>

        <section className="skills-panel" aria-label="Instructors">
          <h2 className="page-h2">Teaching</h2>
          <p>
            Free static site — no accounts. Rough lecture plan and links live on the instructor
            page; compound lists under <code>docs/course/</code> in the repo.
          </p>
          <p>
            <Link to="/instructors" className="welcome-primary" style={{ display: 'inline-block' }}>
              Open instructor pack
            </Link>
          </p>
        </section>

        <h2 className="page-h2">What it is</h2>
        <ul className="page-list">
          <li>Teaching / lab companion for common chromophores and solvents</li>
          <li>Search + full UV teaching curves where seeded; IR/Raman models on majors</li>
          <li>
            Quality tags: teaching vs experimental (schema demo exists for tooling only)
          </li>
        </ul>

        <h2 className="page-h2">What it is not</h2>
        <ul className="page-list">
          <li>Not a NIST-grade spectral archive</li>
          <li>Not a stand-in for primary digitizations when you report numbers</li>
          <li>No backend — pure static files</li>
        </ul>

        <h2 className="page-h2">Methodology</h2>
        <p>
          <a
            href="https://github.com/nikshaybisht/bandatlas/blob/main/docs/methodology.md"
            target="_blank"
            rel="noreferrer"
          >
            docs/methodology.md
          </a>
          {' · '}
          <a
            href="https://github.com/nikshaybisht/bandatlas/blob/main/docs/ADD_SPECTRUM.md"
            target="_blank"
            rel="noreferrer"
          >
            Add a UV seed
          </a>
        </p>

        <h2 className="page-h2">Citation</h2>
        <p className="cite-block">
          Bisht, N. <em>BandAtlas</em> (v{APP_VERSION}).{' '}
          <a href="https://github.com/nikshaybisht/bandatlas">github.com/nikshaybisht/bandatlas</a>.
          MIT.
        </p>

        <p className="page-nav-back">
          <Link to="/">← Explorer</Link>
          {' · '}
          <Link to="/guide">Guide</Link>
          {' · '}
          <Link to="/lab">Lab</Link>
        </p>
      </article>
    </main>
  )
}
