import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MiniSearch from 'minisearch'
import { SpectrumPlot } from '../components/SpectrumPlot'
import { MoleculeViewer } from '../components/MoleculeViewer'
import { PropertyCard } from '../components/PropertyCard'
import { ShareCard } from '../components/ShareCard'
import { CitationsPanel } from '../components/CitationsPanel'
import { ResearchTools } from '../components/ResearchTools'
import { WelcomeCard } from '../components/WelcomeCard'
import { useAppTheme } from '../context/AppThemeContext'
import { buildSearchIndex } from '../lib/search'
import { loadCompound } from '../lib/loadCompound'
import { datasetUrl } from '../lib/paths'
import { isWelcomeDismissed } from '../lib/theme'
import type {
  Compound,
  DatasetIndex,
  IndexCompound,
  Spectrum,
  TechniqueTab,
} from '../types'

type Mode = 'simple' | 'advanced'
type ExplorerPreset = 'default' | 'lab'

const RESULT_CAP = 12

const FALLBACK_META = {
  default_compound_id: 'rhodamine-b',
  lab: {
    compound_id: 'benzene',
    technique: 'uvvis' as TechniqueTab,
    uv_only: true,
    mode: 'simple' as Mode,
  },
}

function qualityLabel(s: Spectrum | null | undefined): string {
  if (!s) return ''
  if (s.quality === 'experimental' && s.example_not_for_citation) return 'Schema example'
  if (s.quality === 'experimental') return 'Experimental'
  return 'Teaching envelope'
}

function spectrumForTab(c: Compound | null, tab: TechniqueTab): Spectrum | null {
  if (!c) return null
  if (tab === 'uvvis') return c.spectra.find((s) => s.technique === 'uvvis_abs') ?? null
  if (tab === 'ir') return c.spectra.find((s) => s.technique === 'ir') ?? null
  return c.spectra.find((s) => s.technique === 'raman') ?? null
}

function resolveDefaultId(
  data: DatasetIndex,
  preferred: string | null | undefined,
): string | null {
  const meta = data.app_meta ?? FALLBACK_META
  const tryId = preferred || meta.default_compound_id
  const hit =
    data.compounds.find((c) => c.id === tryId) ||
    data.compounds.find((c) => c.id === meta.default_compound_id) ||
    data.compounds.find((c) => c.has_uvvis) ||
    data.compounds[0]
  return hit?.id ?? null
}

type Props = {
  preset?: ExplorerPreset
}

export function ExplorerPage({ preset = 'default' }: Props) {
  const { theme } = useAppTheme()
  const navigate = useNavigate()
  const { compoundId: routeCompoundId } = useParams<{ compoundId?: string }>()
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') ?? ''

  const [index, setIndex] = useState<DatasetIndex | null>(null)
  const [searcher, setSearcher] = useState<MiniSearch<IndexCompound> | null>(null)
  const [query, setQuery] = useState(queryFromUrl)
  const [selectedId, setSelectedId] = useState<string | null>(routeCompoundId ?? null)
  const [compound, setCompound] = useState<Compound | null>(null)
  const [compareId, setCompareId] = useState<string | null>(null)
  const [compareCompound, setCompareCompound] = useState<Compound | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [loadingMol, setLoadingMol] = useState(false)
  const [mode, setMode] = useState<Mode>(
    preset === 'lab' ? FALLBACK_META.lab.mode : 'simple',
  )
  const [showEmission, setShowEmission] = useState(true)
  const [technique, setTechnique] = useState<TechniqueTab>(
    preset === 'lab' ? FALLBACK_META.lab.technique : 'uvvis',
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [uvOnly, setUvOnly] = useState(preset === 'lab' ? FALLBACK_META.lab.uv_only : false)
  const [experimentalOnly, setExperimentalOnly] = useState(false)
  const [showWelcome, setShowWelcome] = useState(
    () => preset === 'default' && !isWelcomeDismissed(),
  )
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const bootstrapped = useRef(false)

  // Keep query input in sync when ?q= changes externally
  useEffect(() => {
    setQuery(queryFromUrl)
    if (queryFromUrl.trim()) setSearchOpen(true)
  }, [queryFromUrl])

  // Load dataset once; pick default / route / lab compound
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
        const meta = data.app_meta ?? FALLBACK_META
        if (preset === 'lab') {
          setUvOnly(meta.lab.uv_only)
          setMode(meta.lab.mode)
          setTechnique(meta.lab.technique)
        }
        if (!bootstrapped.current) {
          bootstrapped.current = true
          if (routeCompoundId) {
            setSelectedId(routeCompoundId)
          } else if (preset === 'lab') {
            const id = resolveDefaultId(data, meta.lab.compound_id)
            if (id) setSelectedId(id)
          } else {
            const q = (searchParams.get('q') || '').trim().toLowerCase()
            if (q) {
              const exact =
                data.compounds.find((c) => c.id === q) ||
                data.compounds.find((c) => c.name.toLowerCase() === q)
              if (exact) {
                setSelectedId(exact.id)
                navigate(`/c/${exact.id}`, { replace: true })
              } else {
                const id = resolveDefaultId(data, null)
                if (id) setSelectedId(id)
              }
            } else {
              const id = resolveDefaultId(data, null)
              if (id) setSelectedId(id)
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setIndexError('Failed to load dataset. Run npm run dataset.')
      })
    return () => {
      cancelled = true
    }
    // Intentionally once-ish per mount; route deep links handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  // Deep link path /c/:id while staying on explorer
  useEffect(() => {
    if (routeCompoundId) setSelectedId(routeCompoundId)
  }, [routeCompoundId])

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
          ;(t as HTMLInputElement).blur()
        }
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const results = useMemo(() => {
    if (!index || !searcher) return [] as IndexCompound[]
    const q = query.trim()
    let pool = index.compounds
    if (uvOnly) pool = pool.filter((c) => c.has_uvvis)
    if (experimentalOnly) pool = pool.filter((c) => c.has_experimental)
    if (!q) {
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

  const exampleName = useMemo(() => {
    const meta = index?.app_meta ?? FALLBACK_META
    const id = meta.default_compound_id
    return index?.compounds.find((c) => c.id === id)?.name ?? 'Rhodamine B'
  }, [index])

  const select = useCallback(
    (id: string) => {
      setSelectedId(id)
      setQuery('')
      setSearchOpen(false)
      // Shareable deep link (works under Vite base /bandatlas/)
      navigate(`/c/${id}`, { replace: true })
    },
    [navigate],
  )

  const openExample = useCallback(() => {
    if (!index) return
    const meta = index.app_meta ?? FALLBACK_META
    const id = resolveDefaultId(index, meta.default_compound_id)
    if (id) select(id)
  }, [index, select])

  const onQueryChange = (value: string) => {
    setQuery(value)
    setSearchOpen(true)
  }

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
    <>
      <div className="teaching-banner" role="note">
        Teaching envelopes for learning &amp; triage — not a certified spectral library. Cite
        primary literature for experimental numbers.
      </div>

      {preset === 'lab' && (
        <div className="lab-banner" role="status">
          <strong>Lab companion</strong> — full UV filter on · default benzene · normalized scale.
          Share any compound via <code>/c/&lt;id&gt;</code> from the main explorer.
        </div>
      )}

      <div className="explorer-toolbar">
        <div className="search-wrap" ref={searchBoxRef}>
          <input
            className="search"
            type="search"
            placeholder="Search compound, CAS, or formula…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setSearchOpen(false)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            aria-label="Search compounds"
            aria-expanded={searchOpen && (Boolean(query.trim()) || uvOnly || experimentalOnly)}
            aria-controls="bandatlas-search-results"
            autoComplete="off"
            enterKeyHint="search"
          />
          {searchOpen && (query.trim() || uvOnly || experimentalOnly) && (
            <ul
              id="bandatlas-search-results"
              className="search-dropdown"
              role="listbox"
              aria-label="Search results"
            >
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
                        <span
                          className="hit-badge example"
                          title="Schema example only — not for citation"
                        >
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

        <div className="explorer-filters">
          {index && (
            <span className="count-chip">
              n = {index.counts.total}
              {index.counts.full_spectra != null ? ` · UV ${index.counts.full_spectra}` : ''}
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
        </div>
      </div>

      {showWelcome && (
        <WelcomeCard
          exampleName={exampleName}
          onOpenExample={openExample}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

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
                  <button type="button" className="ghost" onClick={() => setCompareId(null)}>
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
                      <>No {technique === 'ir' ? 'IR' : 'Raman'} series for this compound yet.</>
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
    </>
  )
}
