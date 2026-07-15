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
import type {
  Compound,
  DatasetIndex,
  IndexCompound,
  Spectrum,
  TechniqueTab,
} from './types'
import './App.css'

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
    if (!q) return []
    const hits = searcher.search(q)
    const byId = new Map(index.compounds.map((c) => [c.id, c]))
    return hits
      .map((h) => byId.get(h.id))
      .filter((c): c is IndexCompound => Boolean(c))
      .slice(0, RESULT_CAP)
  }, [index, query, searcher])

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
            {searchOpen && query.trim() && (
              <ul className="search-dropdown" role="listbox">
                {results.length === 0 && (
                  <li className="search-empty">No matches</li>
                )}
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="search-hit"
                      onClick={() => select(c.id)}
                    >
                      <span className="hit-name">{c.name}</span>
                      <span className="hit-meta">
                        {c.formula}
                        {c.has_uvvis ? ' · UV' : ''}
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
              </span>
            )}
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
            BandAtlas · UV {index?.counts.full_spectra ?? '—'} · IR{' '}
            {index?.counts.with_ir ?? '—'} · Raman {index?.counts.with_raman ?? '—'}
          </span>
          <span>
            <a href="https://github.com/nikshaybisht/bandatlas">GitHub</a>
          </span>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
