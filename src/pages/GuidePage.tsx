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

        <h2 className="page-h2">Lab discussion workflow</h2>
        <ol className="guide-steps">
          <li>
            Open <Link to="/lab">Lab companion</Link> — lab set filter is on (all entries have full UV).
          </li>
          <li>
            Pick a class chip (UV dyes, solvents, aromatics…) or search.
          </li>
          <li>
            Use the <strong>discussion card</strong> → <em>Export Lab Note Pack</em> (CSV + JSON +
            Markdown + PNG) or <em>Copy link</em> for peers.
          </li>
        </ol>

        <h2 className="page-h2">Deep links for peers</h2>
        <ul className="page-list">
          <li>
            Compound + technique: <code>/c/benzene?tech=uvvis</code> (also <code>ir</code>,{' '}
            <code>raman</code>)
          </li>
          <li>
            Search query: <code>/?q=anthracene</code>
          </li>
          <li>
            Lab session: <code>/lab</code> or <code>/lab?c=benzene&amp;tech=uvvis</code>
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
