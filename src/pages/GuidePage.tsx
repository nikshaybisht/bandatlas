import { Link } from 'react-router-dom'
import { useDemoTour } from '../context/DemoTourContext'
import { assetUrl } from '../lib/paths'
import { APP_VERSION } from '../lib/version'

const STEPS = [
  {
    id: 'search',
    title: 'Search',
    body: 'Name, CAS, or formula. Try benzene or rhodamine. “Has full UV–Vis” hides catalog-only rows.',
    img: 'images/step-search.png',
    alt: 'Search and comparison',
    anchor: '/?q=rhodamine',
  },
  {
    id: 'uv',
    title: 'UV–Vis',
    body: 'Open a full teaching curve. Normalized vs Absolute scale. Emission when the seed has it.',
    img: 'images/step-uvvis.png',
    alt: 'UV–Vis spectrum',
    anchor: '/c/rhodamine-b?tech=uvvis',
  },
  {
    id: 'nmr',
    title: '¹H / ¹³C NMR',
    body: 'Pilot teaching multiplet lists with 60 & 500 MHz simulation. Not a raw FID.',
    img: 'images/step-nmr.png',
    alt: '¹H NMR teaching spectrum',
    anchor: '/c/benzene?tech=nmr1h',
  },
  {
    id: 'ms',
    title: 'Mass spectrometry',
    body: 'EI / ESI / HRMS / MALDI teaching sticks. Literature intensities often disagree across papers.',
    img: 'images/step-ms.png',
    alt: 'MS teaching stick spectrum',
    anchor: '/c/benzene?tech=ms',
  },
  {
    id: 'ir',
    title: 'IR',
    body: 'Same molecule, IR teaching bands. Raman is the next tab.',
    img: 'images/step-ir.png',
    alt: 'IR spectrum',
    anchor: '/c/rhodamine-b?tech=ir',
  },
  {
    id: 'export',
    title: 'Export',
    body: 'CSV/JSON under Export, or Lab Note Pack on /lab. quality=teaching stays in the headers.',
    img: 'images/step-export.png',
    alt: 'Export controls',
    anchor: '/lab?c=benzene&tech=uvvis',
  },
] as const

export function GuidePage() {
  const { startTour, running } = useDemoTour()

  return (
    <main className="main page-main page-main-wide">
      <article className="page-panel">
        <h1 className="page-h1">Quick guide</h1>
        <p className="page-lead">
          How I usually show the app. Live:{' '}
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
            {running ? 'Tour running…' : 'Quick tour'}
          </button>
          <span className="page-muted">
            Highlights search → UV → IR → export → UV filter on the explorer.
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
                  <Link to={s.anchor}>Open →</Link>
                </p>
              </div>
              <figure className="guide-step-figure">
                <img src={assetUrl(s.img)} alt={s.alt} loading="lazy" width={640} height={360} />
              </figure>
            </li>
          ))}
        </ol>

        <h2 className="page-h2">Stack</h2>
        <p className="page-lead" style={{ marginBottom: 0 }}>
          React + TypeScript + Vite. The compound dataset is built offline into{' '}
          <code>public/dataset/</code>. Static deploy to GitHub Pages under{' '}
          <code>/bandatlas/</code>. Unit tests + Playwright smoke in CI.
        </p>
        <p className="page-muted">v{APP_VERSION}</p>

        <h2 className="page-h2">Data quality</h2>
        <p>
          Most curves are teaching envelopes (models pinned to literature λ<sub>max</sub> / group
          frequencies), not instrument digitizations. Labels are in the UI. Cite primary papers for
          research numbers; cite BandAtlas only as software if you need to.
        </p>

        <p className="page-nav-back">
          <Link to="/">Explorer</Link>
          {' · '}
          <Link to="/lab">Lab</Link>
          {' · '}
          <Link to="/about">About</Link>
          {' · '}
          <Link to="/instructors">Instructors</Link>
        </p>
      </article>
    </main>
  )
}
