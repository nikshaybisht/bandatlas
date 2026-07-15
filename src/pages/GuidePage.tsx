import { Link } from 'react-router-dom'

export function GuidePage() {
  return (
    <main className="main page-main">
      <article className="page-panel">
        <h1 className="page-h1">60-second guide</h1>
        <p className="page-lead">
          Enough to demo BandAtlas in a portfolio walkthrough or the first minute of a lab session.
        </p>

        <ol className="guide-steps">
          <li>
            <strong>Search</strong> — type a name, CAS, or formula (try <code>benzene</code> or{' '}
            <code>rhodamine</code>). Enable <em>Has full UV–Vis</em> to hide catalog-only rows.
          </li>
          <li>
            <strong>Technique tabs</strong> — switch UV–Vis / IR / Raman. Empty UV still has IR and
            Raman teaching envelopes for most catalog entries.
          </li>
          <li>
            <strong>Scale</strong> — <em>Normalized</em> compares shape; <em>Absolute scale</em>{' '}
            shows ε where available. Neither is a research archive mode.
          </li>
          <li>
            <strong>Structure</strong> — 3D from a local SDF cache when available, otherwise PubChem
            (needs network).
          </li>
          <li>
            <strong>Export / share</strong> — CSV and citation folds under the plot. Overlay is
            qualitative only.
          </li>
          <li>
            <strong>Honesty line</strong> — the green teaching banner always stays visible on the
            explorer. Teaching envelopes ≠ experimental digitizations.
          </li>
        </ol>

        <h2 className="page-h2">Deep links for peers</h2>
        <ul className="page-list">
          <li>
            Compound path: <code>/c/benzene</code>
          </li>
          <li>
            Search query: <code>/?q=anthracene</code>
          </li>
          <li>
            Lab preset: <code>/lab</code> (UV filter on, benzene default)
          </li>
        </ul>

        <p className="page-nav-back">
          <Link to="/">Open explorer</Link>
          {' · '}
          <Link to="/lab">Lab companion</Link>
          {' · '}
          <Link to="/about">About &amp; citation</Link>
        </p>
      </article>
    </main>
  )
}
