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
          Static app for UV/IR/Raman teaching. No accounts. v{APP_VERSION}.
        </p>

        <h2 className="page-h2">~10 min walkthrough</h2>
        <ol className="guide-steps">
          <li>
            Point at the banner: these are teaching models, not SI. Cite papers for research
            numbers.
          </li>
          <li>
            Open{' '}
            <a href={`${LIVE}/`} target="_blank" rel="noreferrer">
              live demo
            </a>{' '}
            or <Link to="/">Explorer</Link>. Search <code>rhodamine-b</code>.
          </li>
          <li>
            UV–Vis: Normalized vs Absolute; emission if present. Compare λ_max with β-carotene /
            benzene later if you want a colour story.
          </li>
          <li>IR tab — group-frequency prompts (still a teaching envelope).</li>
          <li>
            Export a note pack or copy <code>/c/&lt;id&gt;?tech=uvvis</code>. Optional{' '}
            <Link to="/lab">Lab</Link> set for a shorter list.
          </li>
        </ol>

        <h2 className="page-h2">Pin a version</h2>
        <p>
          For a workshop, pin a{' '}
          <a href={`${REPO}/releases`} target="_blank" rel="noreferrer">
            release tag
          </a>{' '}
          so the dataset matches what students see. Chrome also shows the app version;{' '}
          <code>summary.json</code> has the dataset stamp.
        </p>

        <h2 className="page-h2">Repo materials</h2>
        <ul className="page-list">
          <li>
            <a href={`${REPO}/blob/main/docs/course/Top50.md`} target="_blank" rel="noreferrer">
              docs/course/Top50.md
            </a>{' '}
            — compound ids
          </li>
          <li>
            <a
              href={`${REPO}/blob/main/docs/course/WORKSHEET.md`}
              target="_blank"
              rel="noreferrer"
            >
              docs/course/WORKSHEET.md
            </a>{' '}
            — short exercises
          </li>
        </ul>

        <h2 className="page-h2">Student links</h2>
        <ul className="page-list">
          <li>
            <Link to="/lab">Lab companion</Link>
          </li>
          <li>
            <Link to="/guide">Guide</Link>
          </li>
          <li>
            <Link to="/c/benzene?tech=uvvis">
              <code>/c/benzene?tech=uvvis</code>
            </Link>
          </li>
        </ul>

        <p className="page-muted">
          Teaching only unless you contribute open experimental series. Methodology is in the repo.
        </p>

        <p className="page-nav-back">
          <Link to="/about">← About</Link>
          {' · '}
          <Link to="/">Explorer</Link>
        </p>
      </article>
    </main>
  )
}
