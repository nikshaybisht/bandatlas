import { Link } from 'react-router-dom'
import { useDemoTour } from '../context/DemoTourContext'
import { assetUrl } from '../lib/paths'
import { APP_VERSION } from '../lib/version'

const STEPS = [
  {
    id: 'search',
    title: 'Search',
    body: 'Type a compound name, CAS, or formula. Try benzene or rhodamine. Enable Has full UV–Vis to hide catalog-only rows.',
    img: 'images/step-search.png',
    alt: 'BandAtlas search and overlay comparison',
    anchor: '/?q=rhodamine',
  },
  {
    id: 'uv',
    title: 'UV–Vis',
    body: 'Open a full teaching curve. Switch Normalized vs Absolute scale. Emission appears when the seed includes it.',
    img: 'images/step-uvvis.png',
    alt: 'UV–Vis spectrum with teaching envelope',
    anchor: '/c/rhodamine-b?tech=uvvis',
  },
  {
    id: 'ir',
    title: 'IR',
    body: 'Same molecule, IR teaching bands for group-frequency discussion. Raman is one tab away.',
    img: 'images/step-ir.png',
    alt: 'Infrared spectrum view',
    anchor: '/c/rhodamine-b?tech=ir',
  },
  {
    id: 'export',
    title: 'Export',
    body: 'CSV/JSON under Export, figure PNG, or Lab Note Pack on /lab — quality=teaching stays in the headers.',
    img: 'images/step-export.png',
    alt: 'Export and multi-technique views',
    anchor: '/lab?c=benzene&tech=uvvis',
  },
] as const

export function GuidePage() {
  const { startTour, running } = useDemoTour()

  return (
    <main className="main page-main page-main-wide">
      <article className="page-panel">
        <h1 className="page-h1">60-second guide</h1>
        <p className="page-lead">
          Portfolio / panel walkthrough: understand BandAtlas and the builder’s shipping stack in
          under a minute. Live demo:{' '}
          <a href="https://nikshaybisht.github.io/bandatlas/">nikshaybisht.github.io/bandatlas</a>.
        </p>

        <div className="guide-tour-cta">
          <button
            type="button"
            className="welcome-primary"
            data-testid="run-60s-tour"
            onClick={startTour}
            disabled={running}
          >
            {running ? 'Tour running…' : 'Run 60s tour'}
          </button>
          <span className="page-muted">
            Scripted highlight on the explorer (search → UV → IR → export → UV filter).
          </span>
        </div>

        <ol className="guide-step-cards">
          {STEPS.map((s, i) => (
            <li key={s.id} id={`guide-${s.id}`} className="guide-step-card">
              <div className="guide-step-text">
                <h2 className="page-h2">
                  {i + 1}. {s.title}
                </h2>
                <p>{s.body}</p>
                <p>
                  <Link to={s.anchor}>Open live →</Link>
                </p>
              </div>
              <figure className="guide-step-figure">
                <img src={assetUrl(s.img)} alt={s.alt} loading="lazy" width={640} height={360} />
              </figure>
            </li>
          ))}
        </ol>

        <h2 className="page-h2">Tech stack (builder signal)</h2>
        <p className="page-lead" style={{ marginBottom: 0 }}>
          Client: <strong>React + TypeScript + Vite</strong> SPA with React Router, base path{' '}
          <code>/bandatlas/</code> for GitHub Pages. Data: Node pipeline (
          <code>npm run dataset</code>) builds a searchable index, teaching UV seeds, IR/Raman
          models, and optional experimental overlays. Quality: unit tests + Playwright smoke + CI
          on every push. Deploy: static artifact to GitHub Pages — no backend.
        </p>
        <p className="page-muted">Application version v{APP_VERSION}.</p>

        <h2 className="page-h2">Honesty</h2>
        <p>
          Most UV/IR/Raman curves are <strong>teaching envelopes</strong> (multi-Gaussian /
          group-frequency models constrained to literature λ<sub>max</sub> or characteristic cm⁻¹) —
          <strong> not</strong> certified instrument digitizations. The UI labels quality
          explicitly. Cite primary literature for research numbers; cite BandAtlas as software only
          (<code>CITATION.cff</code>).
        </p>

        <h2 className="page-h2">Spoken script</h2>
        <p>
          Full 60-second monologue for interviews:{' '}
          <a
            href="https://github.com/nikshaybisht/bandatlas/blob/main/docs/DEMO_SCRIPT.md"
            target="_blank"
            rel="noreferrer"
          >
            docs/DEMO_SCRIPT.md
          </a>
          .
        </p>

        <p className="page-nav-back">
          <Link to="/">Explorer</Link>
          {' · '}
          <Link to="/lab">Lab companion</Link>
          {' · '}
          <Link to="/about">About &amp; skills</Link>
          {' · '}
          <Link to="/instructors">Instructors</Link>
        </p>
      </article>
    </main>
  )
}
