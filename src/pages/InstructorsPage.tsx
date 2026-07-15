import { Link } from 'react-router-dom'
import { APP_VERSION } from '../lib/version'

const LIVE = 'https://nikshaybisht.github.io/bandatlas'
const REPO = 'https://github.com/nikshaybisht/bandatlas'

export function InstructorsPage() {
  return (
    <main className="main page-main page-main-wide">
      <article className="page-panel">
        <h1 className="page-h1">Instructors</h1>
        <p className="page-lead">
          Free static lab companion for teaching UV–Vis / IR / Raman. No accounts, no payments, no
          license keys. App version <strong>v{APP_VERSION}</strong>.
        </p>

        <h2 className="page-h2">10-minute lecture plan</h2>
        <ol className="guide-steps">
          <li>
            <strong>0–1 min — Honesty.</strong> Point at the teaching banner: envelopes are models,
            not certified SI. Cite primary literature for research numbers.
          </li>
          <li>
            <strong>1–3 min — Search.</strong> Open{' '}
            <a href={`${LIVE}/`} target="_blank" rel="noreferrer">
              live demo
            </a>{' '}
            or <Link to="/">Explorer</Link>. Search <code>rhodamine-b</code> or use Featured.
          </li>
          <li>
            <strong>3–6 min — UV–Vis.</strong> Normalized vs Absolute scale; emission toggle if
            present. Mention λ_max and color (compare later with β-carotene / benzene).
          </li>
          <li>
            <strong>6–8 min — IR.</strong> Switch technique tab. Peak markers as functional-group
            prompts (teaching IR, not raw FTIR).
          </li>
          <li>
            <strong>8–10 min — Export &amp; share.</strong> Lab Note Pack or Copy link (
            <code>/c/&lt;id&gt;?tech=uvvis</code>). Optional:{' '}
            <Link to="/lab">Lab companion</Link> for curated set.
          </li>
        </ol>

        <h2 className="page-h2">Pin a release tag</h2>
        <p>
          For workshops, <strong>pin a GitHub release</strong> so demos match a known dataset
          version:
        </p>
        <ul className="page-list">
          <li>
            Releases:{' '}
            <a href={`${REPO}/releases`} target="_blank" rel="noreferrer">
              github.com/nikshaybisht/bandatlas/releases
            </a>
          </li>
          <li>
            Prefer the Pages site after that tag deploys, or clone:
            <code className="mono"> git clone --branch v{APP_VERSION} …</code>
          </li>
          <li>
            Dataset version is also in the UI (chrome) and <code>summary.json</code> /{' '}
            <code>health.json</code>.
          </li>
        </ul>

        <h2 className="page-h2">Course materials (repo)</h2>
        <ul className="page-list">
          <li>
            <a href={`${REPO}/blob/main/docs/course/Top50.md`} target="_blank" rel="noreferrer">
              docs/course/Top50.md
            </a>{' '}
            — 50 compound ids for curriculum modules
          </li>
          <li>
            <a
              href={`${REPO}/blob/main/docs/course/WORKSHEET.md`}
              target="_blank"
              rel="noreferrer"
            >
              docs/course/WORKSHEET.md
            </a>{' '}
            — printable exercises (color vs λ_max, IR group, teaching vs experimental)
          </li>
          <li>
            <a href={`${REPO}/blob/main/docs/WORKSHOP.md`} target="_blank" rel="noreferrer">
              docs/WORKSHOP.md
            </a>{' '}
            — 2-hour workshop outline
          </li>
          <li>
            <a href={`${REPO}/blob/main/docs/DEMO_SCRIPT.md`} target="_blank" rel="noreferrer">
              docs/DEMO_SCRIPT.md
            </a>{' '}
            — 60-second spoken demo
          </li>
        </ul>

        <h2 className="page-h2">Quick student links</h2>
        <ul className="page-list">
          <li>
            <Link to="/lab">Lab companion</Link> — curated full-UV set
          </li>
          <li>
            <Link to="/guide">60-second guide</Link> + Run 60s tour
          </li>
          <li>
            Example deep link:{' '}
            <Link to="/c/benzene?tech=uvvis">
              <code>/c/benzene?tech=uvvis</code>
            </Link>
          </li>
        </ul>

        <p className="page-muted">
          Teaching envelopes only unless you contribute open experimental series with clear
          redistribution rights. See methodology on GitHub.
        </p>

        <p className="page-nav-back">
          <Link to="/about">← About</Link>
          {' · '}
          <Link to="/">Explorer</Link>
          {' · '}
          <Link to="/lab">Lab</Link>
        </p>
      </article>
    </main>
  )
}
