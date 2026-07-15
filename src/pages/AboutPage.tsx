import { Link } from 'react-router-dom'
import { APP_VERSION } from '../lib/version'

export function AboutPage() {
  return (
    <main className="main page-main">
      <article className="page-panel">
        <h1 className="page-h1">About BandAtlas</h1>
        <p className="page-lead">
          BandAtlas is a static browser application for exploring small-molecule{' '}
          <strong>UV–Vis</strong>, <strong>IR</strong>, and <strong>Raman</strong> records
          alongside structures and export tools. Version {APP_VERSION}.
        </p>

        <h2 className="page-h2">What it is</h2>
        <ul className="page-list">
          <li>A teaching and lab-discussion companion for common chromophores and solvents</li>
          <li>Searchable catalog with full UV teaching curves plus IR/Raman for every entry</li>
          <li>Honest quality tags: teaching envelope vs experimental vs schema demo</li>
          <li>
            Offline-friendly SDF structure cache for demo compounds; PubChem fallback when online
          </li>
        </ul>

        <h2 className="page-h2">What it is not</h2>
        <ul className="page-list">
          <li>
            <strong>Not</strong> a certified spectral library or instrument-grade reference archive
          </li>
          <li>
            <strong>Not</strong> a substitute for primary literature digitizations when reporting
            experimental numbers
          </li>
          <li>
            <strong>Not</strong> a backend service — everything ships as static files (GitHub Pages)
          </li>
        </ul>

        <h2 className="page-h2">Methodology</h2>
        <p>
          How teaching envelopes are built, how experimental series are accepted, and what is
          forbidden is documented in the repository methodology note.
        </p>
        <p>
          <a
            href="https://github.com/nikshaybisht/bandatlas/blob/main/docs/methodology.md"
            target="_blank"
            rel="noreferrer"
          >
            docs/methodology.md on GitHub
          </a>
          {' · '}
          <a
            href="https://github.com/nikshaybisht/bandatlas/blob/main/docs/ADD_SPECTRUM.md"
            target="_blank"
            rel="noreferrer"
          >
            Add a UV teaching seed
          </a>
        </p>

        <h2 className="page-h2">Citation</h2>
        <p className="cite-block">
          Bisht, N. <em>BandAtlas</em> (v{APP_VERSION}).{' '}
          <a href="https://github.com/nikshaybisht/bandatlas">github.com/nikshaybisht/bandatlas</a>.
          Live:{' '}
          <a href="https://nikshaybisht.github.io/bandatlas/">
            nikshaybisht.github.io/bandatlas
          </a>
          . MIT License.
        </p>
        <p className="page-muted">
          Prefer <code>CITATION.cff</code> in the repository for machine-readable citation metadata.
        </p>

        <h2 className="page-h2">Legal</h2>
        <p>
          Software is released under the <strong>MIT</strong> license. Compound identifiers and
          literature pointers belong to their respective sources; teaching envelopes are original
          model curves constrained to tabulated λ_max / group frequencies — not raw instrument
          dumps.
        </p>

        <p className="page-nav-back">
          <Link to="/">← Back to explorer</Link>
          {' · '}
          <Link to="/guide">60-second guide</Link>
          {' · '}
          <Link to="/lab">Lab companion</Link>
        </p>
      </article>
    </main>
  )
}
