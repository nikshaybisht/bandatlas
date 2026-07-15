import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { datasetUrl } from './lib/paths'
import type {
  Compound,
  DatasetIndex,
  IndexCompound,
  Spectrum,
  TechniqueTab,
} from './types'
import './App.css'

const APP_VERSION = '0.7.1'

function qualityLabel(s: Spectrum | null | undefined): string {
  if (!s) return ''
  if (s.quality === 'experimental' && s.example_not_for_citation) return 'Schema example'
  if (s.quality === 'experimental') return 'Experimental'
  return 'Teaching envelope'
}

type Mode = 'simple' | 'advanced'

const RESULT_CAP = 12

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [uvOnly, setUvOnly] = useState(false)
  const [experimentalOnly, setExperimentalOnly] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('bandatlas-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      /* ignore */
    }
    return 'dark'
  })
  const searchBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.body.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem('bandatlas-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    let cancelled = false
    fetch(datasetUrl('index.json'))
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
        if (!cancelled) setIndexError('Failed to load dataset. Run npm run dataset.')
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
          setLoadError(`Could not load “${selectedId}”.`)
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

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchBoxRef.current?.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const results = useMemo(() => {
    if (!index || !searcher) return [] as IndexCompound[]
    const q = query.trim()
    let pool = index.compounds
    if (uvOnly) pool = pool.filter((c) => c.has_uvvis)
    if (experimentalOnly) pool = pool.filter((c) => c.has_experimental)
    if (!q) {
      // Filters on + empty query → discovery list
      if (uvOnly || experimentalOnly) return pool.slice(0, RESULT_CAP)
      return []
    }
    const hits = searcher.search(q)
    const byId = new Map(pool.map((c) => [c.id, c]))
    return hits
      .map((h) => byId.get(h.id))
      .filter((c): c is IndexCompound => Boolean(c))
      .slice(0, RESULT_CAP)
  }, [index, query, searcher, uvOnly, experimentalOnly])

  const select = useCallback((id: string) => {
    setSelectedId(id)
    setQuery('')
    setSearchOpen(false)
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
            <span className="logo">BandAtlas</span>
          </div>

          <div className="search-wrap" ref={searchBoxRef}>
            <input
              className="search"
              type="search"
              placeholder="Search compound, CAS, or formula…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              autoFocus
              aria-label="Search compounds"
              autoComplete="off"
            />
            {searchOpen && (query.trim() || uvOnly || experimentalOnly) && (
              <ul className="search-dropdown" role="listbox">
                {results.length === 0 && (
                  <li className="search-empty">
                    {experimentalOnly
                      ? 'No real experimental series yet (open data only)'
                      : uvOnly
                        ? 'No full UV–Vis curves match'
                        : 'No matches'}
                  </li>
                )}
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="search-hit"
                      onClick={() => select(c.id)}
                    >
                      <span className="hit-name">
                        {c.name}
                        {c.has_experimental ? (
                          <span className="hit-badge experimental" title="Has experimental spectrum">
                            Exp
                          </span>
                        ) : c.has_experimental_example ? (
                          <span className="hit-badge example" title="Schema example only — not for citation">
                            Demo
                          </span>
                        ) : null}
                        {c.has_uvvis ? (
                          <span
                            className="hit-badge uv"
                            title={
                              c.has_experimental
                                ? 'Full UV–Vis (includes experimental)'
                                : 'Full UV–Vis teaching curve'
                            }
                          >
                            UV
                          </span>
                        ) : (
                          <span className="hit-badge catalog" title="Catalog / IR–Raman only">
                            IR/Ra
                          </span>
                        )}
                      </span>
                      <span className="hit-meta">
                        {c.formula}
                        {c.has_experimental
                          ? ' · experimental'
                          : c.has_uvvis
                            ? ' · full UV–Vis (teaching)'
                            : ' · catalog'}
                        {c.has_ir ? ' · IR' : ''}
                        {c.has_raman ? ' · Ra' : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="hit-overlay"
                      title="Overlay on current spectrum"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCompareId((prev) => (prev === c.id ? null : c.id))
                        setSearchOpen(false)
                        setQuery('')
                      }}
                    >
                      Overlay
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="top-meta">
            {index && (
              <span className="count-chip">
                n = {index.counts.total}
                {index.counts.full_spectra != null
                  ? ` · UV ${index.counts.full_spectra}`
                  : ''}
              </span>
            )}
            <label
              className="filter-chip"
              title="Show only compounds with a full UV–Vis curve"
              data-testid="filter-uv-only-label"
            >
              <input
                type="checkbox"
                data-testid="filter-uv-only"
                checked={uvOnly}
                onChange={(e) => {
                  setUvOnly(e.target.checked)
                  if (e.target.checked) setSearchOpen(true)
                }}
              />
              Has full UV–Vis
            </label>
            <label
              className="filter-chip"
              title="Show only compounds with real experimental series (excludes schema demos)"
              data-testid="filter-experimental-only-label"
            >
              <input
                type="checkbox"
                data-testid="filter-experimental-only"
                checked={experimentalOnly}
                onChange={(e) => {
                  setExperimentalOnly(e.target.checked)
                  if (e.target.checked) setSearchOpen(true)
                }}
              />
              Experimental only
            </label>
            <button
              type="button"
              className="ghost theme-toggle"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        {indexError && <div className="banner error">{indexError}</div>}
        {loadError && <div className="banner error">{loadError}</div>}
        {loadingMol && !compound && <div className="banner">Loading…</div>}

        <main className="main">
          {compound && (
            <>
              <div className="main-toolbar">
                <div className="tabs" role="tablist" aria-label="Technique">
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
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <div className="view-toggles">
                  <div className="seg" role="group" aria-label="Y-axis display scale">
                    <button
                      type="button"
                      className={mode === 'simple' ? 'active' : ''}
                      onClick={() => setMode('simple')}
                      title="Normalize curves for shape comparison (teaching default)"
                    >
                      Normalized
                    </button>
                    <button
                      type="button"
                      className={mode === 'advanced' ? 'active' : ''}
                      onClick={() => setMode('advanced')}
                      title="Show ε (or raw intensity) where available — not a research-grade archive mode"
                    >
                      Absolute scale
                    </button>
                  </div>
                  {technique === 'uvvis' && emission && (
                    <button
                      type="button"
                      className={`ghost emission-toggle ${showEmission ? 'active' : ''}`}
                      onClick={() => setShowEmission((v) => !v)}
                      title="Toggle fluorescence emission curve"
                    >
                      Emission {showEmission ? 'on' : 'off'}
                    </button>
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
                    {compareCompound ? ` · vs ${compareCompound.name}` : ''}
                  </h2>
                  <SpectrumPlot
                    key={`${compound.id}-${technique}-${mode}-${theme}`}
                    primary={primary}
                    emission={emission}
                    showEmission={showEmission}
                    mode={mode}
                    technique={technique}
                    moleculeName={compound.name}
                    compare={compareSpec}
                    compareName={compareCompound?.name}
                    theme={theme}
                  />
                  {!primary && (
                    <div className="spectrum-empty-banner" role="status">
                      {technique === 'uvvis' ? (
                        <>
                          <strong>No full UV–Vis teaching curve yet</strong> for{' '}
                          <strong>{compound.name}</strong>. This catalog entry still has{' '}
                          <strong>IR</strong> and <strong>Raman</strong> teaching envelopes — use
                          those tabs. To browse only compounds with a full UV curve, enable{' '}
                          <em>Has full UV–Vis</em> in the search bar.
                        </>
                      ) : (
                        <>
                          No {technique === 'ir' ? 'IR' : 'Raman'} series for this compound yet.
                        </>
                      )}
                    </div>
                  )}
                  {primary && (
                    <p className="quality-line" title="Data quality">
                      <span
                        className={`inline-quality ${
                          primary.quality === 'experimental'
                            ? primary.example_not_for_citation
                              ? 'example'
                              : 'experimental'
                            : 'teaching'
                        }`}
                      >
                        {qualityLabel(primary)}
                      </span>
                      {primary.solvent ? ` · solvent = ${primary.solvent}` : ''}
                      {primary.temperature_K != null ? ` · T = ${primary.temperature_K} K` : ''}
                      {primary.source?.note ? ` · ${primary.source.note}` : ''}
                    </p>
                  )}
                  {compareSpec && (
                    <p className="overlay-disclaimer" role="note">
                      Overlay is <strong>qualitative only</strong> — solvents, normalizations, and
                      envelope construction may differ. Not for quantitative comparison.
                    </p>
                  )}
                  <div className="tool-row">
                    <ResearchTools
                      compound={compound}
                      spectrum={primary}
                      technique={technique}
                    />
                    <CitationsPanel compound={compound} activeSpectrum={primary} />
                    <ShareCard
                      compound={compound}
                      technique={technique}
                      caption={
                        primary?.plain_caption ||
                        compound.plain_summary ||
                        `${compound.name} spectrum`
                      }
                    />
                  </div>
                </section>

                <section className="panel side-panel">
                  <PropertyCard
                    compound={compound}
                    activeSpectrum={primary}
                    technique={technique}
                  />
                  {compound.pubchem_cid ? (
                    <MoleculeViewer
                      key={`${compound.pubchem_cid}-${theme}`}
                      pubchemCid={compound.pubchem_cid}
                      name={compound.name}
                    />
                  ) : (
                    <div className="mol-viewer">
                      <div className="mol-status error">No PubChem CID.</div>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </main>

        <footer className="footer">
          <span>
            BandAtlas v{APP_VERSION} · UV {index?.counts.full_spectra ?? '—'} · IR{' '}
            {index?.counts.with_ir ?? '—'} · Raman {index?.counts.with_raman ?? '—'}
            {' · '}teaching envelopes, not certified digitizations
          </span>
          <span>
            <a href="https://github.com/nikshaybisht/bandatlas">GitHub</a>
            {' · '}
            <a href="https://nikshaybisht.github.io/bandatlas/">Live demo</a>
          </span>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
