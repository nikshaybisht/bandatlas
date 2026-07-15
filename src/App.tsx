import { useCallback, useEffect, useMemo, useState } from 'react'
import MiniSearch from 'minisearch'
import { SpectrumPlot } from './components/SpectrumPlot'
import { MoleculeViewer } from './components/MoleculeViewer'
import { PropertyCard } from './components/PropertyCard'
import { ShareCard } from './components/ShareCard'
import { CitationsPanel } from './components/CitationsPanel'
import { ResearchTools } from './components/ResearchTools'
import { ErrorBoundary } from './components/ErrorBoundary'
import { buildSearchIndex } from './lib/search'
import { loadCompound } from './lib/loadCompound'
import type {
  Compound,
  DatasetIndex,
  IndexCompound,
  Spectrum,
  TechniqueTab,
} from './types'
import './App.css'

type Mode = 'simple' | 'advanced'

const RESULT_CAP = 80

function spectrumForTab(c: Compound | null, tab: TechniqueTab): Spectrum | null {
  if (!c) return null
  if (tab === 'uvvis') return c.spectra.find((s) => s.technique === 'uvvis_abs') ?? null
  if (tab === 'ir') return c.spectra.find((s) => s.technique === 'ir') ?? null
  return c.spectra.find((s) => s.technique === 'raman') ?? null
}

export default function App() {
  const [index, setIndex] = useState<DatasetIndex | null>(null)
  const [searcher, setSearcher] = useState<MiniSearch<IndexCompound> | null>(null)
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<string | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compound, setCompound] = useState<Compound | null>(null)
  const [compareId, setCompareId] = useState<string | null>(null)
  const [compareCompound, setCompareCompound] = useState<Compound | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [loadingMol, setLoadingMol] = useState(false)
  const [mode, setMode] = useState<Mode>('simple')
  const [showEmission, setShowEmission] = useState(true)
  const [technique, setTechnique] = useState<TechniqueTab>('uvvis')
  const [dark, setDark] = useState(true)
  const [showMethods, setShowMethods] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    let cancelled = false
    fetch('/dataset/index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: DatasetIndex) => {
        if (cancelled) return
        setIndex(data)
        setSearcher(buildSearchIndex(data.compounds))
        const first =
          data.compounds.find((c) => c.id === 'rhodamine-b') ||
          data.compounds.find((c) => c.has_uvvis) ||
          data.compounds[0]
        if (first) setSelectedId(first.id)
      })
      .catch(() => {
        if (!cancelled) setIndexError('Failed to load dataset index. Run npm run dataset.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setLoadingMol(true)
    setLoadError(null)
    loadCompound(selectedId)
      .then((c) => {
        if (!cancelled) {
          setCompound(c)
          setLoadingMol(false)
          if (c.availability.uvvis_abs) setTechnique('uvvis')
          else if (c.availability.ir) setTechnique('ir')
          else if (c.availability.raman) setTechnique('raman')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(`Could not load record “${selectedId}”.`)
          setLoadingMol(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    if (!compareId) {
      setCompareCompound(null)
      return
    }
    let cancelled = false
    loadCompound(compareId).then((c) => {
      if (!cancelled) setCompareCompound(c)
    })
    return () => {
      cancelled = true
    }
  }, [compareId])

  const results = useMemo(() => {
    if (!index) return [] as IndexCompound[]
    let list = index.compounds
    if (family !== 'all') list = list.filter((c) => c.family === family)
    const q = query.trim()
    if (!q || !searcher) {
      return list
        .slice()
        .sort(
          (a, b) =>
            Number(b.has_uvvis) - Number(a.has_uvvis) ||
            Number(b.has_ir) - Number(a.has_ir) ||
            a.name.localeCompare(b.name),
        )
        .slice(0, RESULT_CAP)
    }
    const hits = searcher.search(q)
    const byId = new Map(index.compounds.map((c) => [c.id, c]))
    let out = hits
      .map((h) => byId.get(h.id))
      .filter((c): c is IndexCompound => Boolean(c))
    if (family !== 'all') out = out.filter((c) => c.family === family)
    return out.slice(0, RESULT_CAP)
  }, [index, query, family, searcher])

  const select = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const primary = spectrumForTab(compound, technique)
  const emission =
    technique === 'uvvis'
      ? compound?.spectra.find((s) => s.technique === 'fluorescence')
      : undefined
  const compareSpec = spectrumForTab(compareCompound, technique)

  const tabAvailable = (tab: TechniqueTab) => {
    if (!compound) return false
    if (tab === 'uvvis') return compound.availability.uvvis_abs
    if (tab === 'ir') return compound.availability.ir
    return compound.availability.raman
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="logo">MolSpectra</span>
            <span className="tagline">
              Small-molecule UV–Vis, IR &amp; Raman viewer for teaching and literature triage
            </span>
          </div>
          <div className="search-wrap">
            <input
              className="search"
              type="search"
              placeholder="Name, CAS, formula, or SMILES (e.g. anthracene, 58-08-2, C6H6)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-label="Search compounds"
            />
          </div>
          <div className="top-actions">
            <button type="button" className="ghost" onClick={() => setShowMethods((v) => !v)}>
              {showMethods ? 'Hide methods' : 'Methods'}
            </button>
            <button type="button" className="ghost" onClick={() => setDark((d) => !d)}>
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        {showMethods && (
          <div className="methods-banner">
            <strong>Methods (short).</strong> Compound identities and 3D conformers from PubChem.
            UV–Vis teaching curves are multi-Gaussian envelopes constrained to literature λ
            <sub>max</sub> / relative ε where available. IR/Raman envelopes use characteristic
            group frequencies (Pretsch; Socrates). Display points are downsampled for interaction;
            export CSV for the plotted series. This is a triage and teaching client—not a
            replacement for digitised instrument archives or primary papers. Full write-up:{' '}
            <code>docs/methodology.md</code>.
          </div>
        )}

        <div className="layout">
          <aside className="sidebar">
            <div className="side-section">
              <h3>Compound classes</h3>
              <button
                type="button"
                className={family === 'all' ? 'family active' : 'family'}
                onClick={() => setFamily('all')}
              >
                All compounds
                <span>{index?.counts.total ?? '…'}</span>
              </button>
              {index?.families.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={family === f.id ? 'family active' : 'family'}
                  onClick={() => setFamily(f.id)}
                >
                  {f.label}
                  <span>{f.count}</span>
                </button>
              ))}
            </div>
            <div className="side-section compounds">
              <h3>
                Hits
                {results.length
                  ? ` (${results.length}${results.length >= RESULT_CAP ? '+' : ''})`
                  : ''}
              </h3>
              {indexError && <p className="side-empty error">{indexError}</p>}
              {!indexError && !results.length && (
                <p className="side-empty">No matches. Broaden the query or reset class filter.</p>
              )}
              <ul className="compound-list">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={c.id === selectedId ? 'compound active' : 'compound'}
                      onClick={() => select(c.id)}
                    >
                      <span className="cname">{c.name}</span>
                      <span className="cmeta">
                        {c.has_uvvis ? 'UV' : ''}
                        {c.has_ir ? ' IR' : ''}
                        {c.has_raman ? ' Ra' : ''}
                        {!c.has_uvvis && !c.has_ir ? ' ·' : ''} {c.formula}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={c.id === compareId ? 'compare-btn active' : 'compare-btn'}
                      title="Overlay this compound on the active spectrum"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCompareId((prev) => (prev === c.id ? null : c.id))
                      }}
                    >
                      {c.id === compareId ? 'Overlay on' : 'Overlay'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="main">
            {loadError && <div className="banner error">{loadError}</div>}
            {loadingMol && compound && (
              <div className="banner subtle">Loading record…</div>
            )}
            {loadingMol && !compound && <div className="banner">Loading record…</div>}

            {compound && (
              <>
                <div className="main-toolbar">
                  <div className="tabs" role="tablist" aria-label="Spectroscopic technique">
                    {(
                      [
                        ['uvvis', 'UV–Vis'],
                        ['ir', 'IR'],
                        ['raman', 'Raman'],
                      ] as const
                    ).map(([id, label]) => {
                      const on = tabAvailable(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          className={`tab ${technique === id ? 'active' : ''} ${on ? '' : 'empty'}`}
                          aria-selected={technique === id}
                          onClick={() => setTechnique(id)}
                          title={on ? label : `${label} not available for this record`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="view-toggles">
                    <div className="seg" role="group" aria-label="Display mode">
                      <button
                        type="button"
                        className={mode === 'simple' ? 'active' : ''}
                        onClick={() => setMode('simple')}
                      >
                        Teaching
                      </button>
                      <button
                        type="button"
                        className={mode === 'advanced' ? 'active' : ''}
                        onClick={() => setMode('advanced')}
                      >
                        Research
                      </button>
                    </div>
                    {technique === 'uvvis' && (
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={showEmission}
                          onChange={(e) => setShowEmission(e.target.checked)}
                          disabled={!emission}
                        />
                        Emission
                      </label>
                    )}
                    {compareId && (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => setCompareId(null)}
                      >
                        Clear overlay
                      </button>
                    )}
                  </div>
                </div>

                <div className="hero-grid">
                  <section className="panel spectrum-wrap">
                    <h2 className="panel-title">
                      {technique === 'uvvis'
                        ? 'Electronic spectrum'
                        : technique === 'ir'
                          ? 'Infrared spectrum'
                          : 'Raman spectrum'}
                      {compareCompound ? ` · overlay: ${compareCompound.name}` : ''}
                    </h2>
                    <SpectrumPlot
                      primary={primary}
                      emission={emission}
                      showEmission={showEmission}
                      mode={mode}
                      technique={technique}
                      moleculeName={compound.name}
                      compare={compareSpec}
                      compareName={compareCompound?.name}
                    />
                    <ResearchTools
                      compound={compound}
                      spectrum={primary}
                      technique={technique}
                    />
                    <ShareCard
                      compound={compound}
                      technique={technique}
                      caption={
                        primary?.plain_caption ||
                        compound.plain_summary ||
                        `${compound.name} spectrum`
                      }
                    />
                    <CitationsPanel compound={compound} activeSpectrum={primary} />
                  </section>

                  <section className="panel side-panel">
                    <PropertyCard compound={compound} />
                    {compound.pubchem_cid ? (
                      <MoleculeViewer
                        key={compound.pubchem_cid}
                        pubchemCid={compound.pubchem_cid}
                        name={compound.name}
                      />
                    ) : (
                      <div className="mol-viewer">
                        <div className="mol-status error">No PubChem CID for 3D display.</div>
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </main>
        </div>

        <footer className="footer">
          <span>
            Dataset {index?.version ?? '…'} · UV {index?.counts.full_spectra ?? '—'} · IR{' '}
            {index?.counts.with_ir ?? '—'} · Raman {index?.counts.with_raman ?? '—'} · n ={' '}
            {index?.counts.total ?? '—'}
          </span>
          <span>
            Teaching / curated packaging · 3D: PubChem ·{' '}
            <a href="https://github.com/nikshaybisht/molspectra">source</a> · cite{' '}
            <code>CITATION.cff</code>
          </span>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
