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
import { LabDiscussionCard } from '../components/LabDiscussionCard'
import { useAppTheme } from '../context/AppThemeContext'
import { buildSearchIndex } from '../lib/search'
import { loadCompound } from '../lib/loadCompound'
import { datasetUrl } from '../lib/paths'
import { parseTechniqueParam } from '../lib/export'
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
    lab_set_only: true,
    mode: 'simple' as Mode,
  },
  lab_classes: [
    { id: 'dyes', label: 'UV dyes' },
    { id: 'solvents', label: 'Solvents' },
    { id: 'aromatics', label: 'Aromatics' },
    { id: 'porphyrins', label: 'Porphyrins' },
    { id: 'biomolecules', label: 'Biomolecules' },
  ],
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
  labOnly: boolean,
): string | null {
  const meta = data.app_meta ?? FALLBACK_META
  const tryId = preferred || meta.default_compound_id
  const pool = labOnly ? data.compounds.filter((c) => c.lab_set) : data.compounds
  const hit =
    pool.find((c) => c.id === tryId) ||
    pool.find((c) => c.id === meta.lab?.compound_id) ||
    pool.find((c) => c.has_uvvis) ||
    pool[0] ||
    data.compounds.find((c) => c.has_uvvis) ||
    data.compounds[0]
  return hit?.id ?? null
}

type Props = {
  preset?: ExplorerPreset
}

export function ExplorerPage({ preset = 'default' }: Props) {
  const isLab = preset === 'lab'
  const { theme } = useAppTheme()
  const navigate = useNavigate()
  const { compoundId: routeCompoundId } = useParams<{ compoundId?: string }>()
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') ?? ''
  const techFromUrl = parseTechniqueParam(searchParams.get('tech'))

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
  const [mode, setMode] = useState<Mode>(isLab ? FALLBACK_META.lab.mode : 'simple')
  const [showEmission, setShowEmission] = useState(true)
  const [technique, setTechnique] = useState<TechniqueTab>(
    techFromUrl || (isLab ? FALLBACK_META.lab.technique : 'uvvis'),
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [uvOnly, setUvOnly] = useState(false)
  const [labSetOnly, setLabSetOnly] = useState(isLab)
  const [labClass, setLabClass] = useState<string | null>(null)
  const [experimentalOnly, setExperimentalOnly] = useState(false)
  const [showWelcome, setShowWelcome] = useState(
    () => !isLab && !isWelcomeDismissed(),
  )
  /** When true, do not auto-pick technique from compound availability (deep link owns it). */
  const techLocked = useRef(Boolean(techFromUrl))
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const bootstrapped = useRef(false)

  useEffect(() => {
    setQuery(queryFromUrl)
    if (queryFromUrl.trim()) setSearchOpen(true)
  }, [queryFromUrl])

  // Apply ?tech= from URL when it changes
  useEffect(() => {
    const t = parseTechniqueParam(searchParams.get('tech'))
    if (t) {
      techLocked.current = true
      setTechnique(t)
    }
  }, [searchParams])

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
        if (isLab) {
          setLabSetOnly(meta.lab.lab_set_only !== false)
          setMode(meta.lab.mode)
          if (!techFromUrl) setTechnique(meta.lab.technique)
        }
        if (!bootstrapped.current) {
          bootstrapped.current = true
          if (routeCompoundId) {
            setSelectedId(routeCompoundId)
          } else if (isLab) {
            const fromQuery = searchParams.get('c')
            const preferred = fromQuery || meta.lab.compound_id
            const id = resolveDefaultId(data, preferred, true)
            if (id) setSelectedId(id)
          } else {
            const q = (searchParams.get('q') || '').trim().toLowerCase()
            if (q) {
              const exact =
                data.compounds.find((c) => c.id === q) ||
                data.compounds.find((c) => c.name.toLowerCase() === q)
              if (exact) {
                setSelectedId(exact.id)
                const techQ = parseTechniqueParam(searchParams.get('tech'))
                navigate(
                  `/c/${exact.id}${techQ ? `?tech=${techQ}` : ''}`,
                  { replace: true },
                )
              } else {
                const id = resolveDefaultId(data, null, false)
                if (id) setSelectedId(id)
              }
            } else {
              const id = resolveDefaultId(data, null, false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

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
          if (!techLocked.current) {
            if (c.availability.uvvis_abs) setTechnique('uvvis')
            else if (c.availability.ir) setTechnique('ir')
            else if (c.availability.raman) setTechnique('raman')
          } else {
            // Honor deep-link tech if available; otherwise fall back
            const want = technique
            const ok =
              (want === 'uvvis' && c.availability.uvvis_abs) ||
              (want === 'ir' && c.availability.ir) ||
              (want === 'raman' && c.availability.raman)
            if (!ok) {
              if (c.availability.uvvis_abs) setTechnique('uvvis')
              else if (c.availability.ir) setTechnique('ir')
              else if (c.availability.raman) setTechnique('raman')
            }
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const labClasses = index?.app_meta?.lab_classes ?? FALLBACK_META.lab_classes

  const results = useMemo(() => {
    if (!index || !searcher) return [] as IndexCompound[]
    const q = query.trim()
    let pool = index.compounds
    if (labSetOnly) pool = pool.filter((c) => c.lab_set)
    if (labClass) {
      pool = pool.filter((c) => (c.lab_classes || []).includes(labClass))
    }
    if (uvOnly) pool = pool.filter((c) => c.has_uvvis)
    if (experimentalOnly) pool = pool.filter((c) => c.has_experimental)
    if (!q) {
      if (labSetOnly || labClass || uvOnly || experimentalOnly) {
        return pool.slice(0, isLab ? 24 : RESULT_CAP)
      }
      return []
    }
    const hits = searcher.search(q)
    const byId = new Map(pool.map((c) => [c.id, c]))
    return hits
      .map((h) => byId.get(h.id))
      .filter((c): c is IndexCompound => Boolean(c))
      .slice(0, isLab ? 24 : RESULT_CAP)
  }, [index, query, searcher, uvOnly, experimentalOnly, labSetOnly, labClass, isLab])

  const exampleName = useMemo(() => {
    const meta = index?.app_meta ?? FALLBACK_META
    const id = meta.default_compound_id
    return index?.compounds.find((c) => c.id === id)?.name ?? 'Rhodamine B'
  }, [index])

  /** Peer share URL path (/c/:id?tech=). Lab session keeps /lab?c=&tech=. */
  const navigateToCompound = useCallback(
    (id: string, tech: TechniqueTab) => {
      navigate(`/c/${id}?tech=${tech}`, { replace: true })
    },
    [navigate],
  )

  const syncLabUrl = useCallback(
    (id: string, tech: TechniqueTab) => {
      navigate(`/lab?c=${encodeURIComponent(id)}&tech=${tech}`, { replace: true })
    },
    [navigate],
  )

  const select = useCallback(
    (id: string) => {
      techLocked.current = false
      setSelectedId(id)
      setQuery('')
      setSearchOpen(false)
      if (isLab) syncLabUrl(id, technique)
      else navigateToCompound(id, technique)
    },
    [isLab, navigateToCompound, syncLabUrl, technique],
  )

  const setTechniqueAndUrl = useCallback(
    (t: TechniqueTab) => {
      techLocked.current = true
      setTechnique(t)
      if (!selectedId) return
      if (isLab) syncLabUrl(selectedId, t)
      else navigateToCompound(selectedId, t)
    },
    [isLab, navigateToCompound, selectedId, syncLabUrl],
  )

  const openExample = useCallback(() => {
    if (!index) return
    const meta = index.app_meta ?? FALLBACK_META
    const id = resolveDefaultId(index, meta.default_compound_id, false)
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

      {isLab && (
        <div className="lab-banner" role="status">
          <strong>Lab companion</strong> — before UV/IR discussion, open a compound and export a
          note pack. Default filter: curated lab set (
          {index?.counts.lab_set ?? '—'} compounds, all with full UV).
        </div>
      )}

      <div className="explorer-toolbar">
        <div className="search-wrap" ref={searchBoxRef}>
          <input
            className="search"
            type="search"
            placeholder={
              isLab
                ? 'Search lab set (name, CAS, formula)…'
                : 'Search compound, CAS, or formula…'
            }
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
            aria-expanded={
              searchOpen &&
              (Boolean(query.trim()) || uvOnly || experimentalOnly || labSetOnly || Boolean(labClass))
            }
            aria-controls="bandatlas-search-results"
            autoComplete="off"
            enterKeyHint="search"
          />
          {searchOpen &&
            (query.trim() || uvOnly || experimentalOnly || labSetOnly || labClass) && (
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
                      : labSetOnly || labClass
                        ? 'No lab-set matches'
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
                        {c.lab_set ? (
                          <span className="hit-badge lab" title="Lab companion set">
                            Lab
                          </span>
                        ) : null}
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
                          <span className="hit-badge uv" title="Full UV–Vis teaching curve">
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
                        {c.lab_set ? ' · lab set' : ''}
                        {c.has_uvvis ? ' · full UV' : ' · catalog'}
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
              {index.counts.lab_set != null ? ` · lab ${index.counts.lab_set}` : ''}
            </span>
          )}
          {(isLab || labSetOnly) && (
            <label
              className="filter-chip"
              title="Curated lab companion compounds (all have full UV)"
              data-testid="filter-lab-set-label"
            >
              <input
                type="checkbox"
                data-testid="filter-lab-set"
                checked={labSetOnly}
                onChange={(e) => {
                  setLabSetOnly(e.target.checked)
                  if (e.target.checked) setSearchOpen(true)
                }}
              />
              Lab set
            </label>
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

      {isLab && (
        <div className="lab-chips" role="toolbar" aria-label="Lab class filters">
          <button
            type="button"
            className={`lab-chip ${labClass === null ? 'active' : ''}`}
            onClick={() => {
              setLabClass(null)
              setSearchOpen(true)
            }}
          >
            All lab
          </button>
          {labClasses.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`lab-chip ${labClass === c.id ? 'active' : ''}`}
              data-testid={`lab-chip-${c.id}`}
              onClick={() => {
                setLabClass((prev) => (prev === c.id ? null : c.id))
                setLabSetOnly(true)
                setSearchOpen(true)
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

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
            {isLab && (
              <LabDiscussionCard
                compound={compound}
                spectrum={primary}
                technique={technique}
                onTechniqueChange={setTechniqueAndUrl}
              />
            )}

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
                      onClick={() => setTechniqueAndUrl(id)}
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
                {primary ? (
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
                ) : (
                  <div className="spectrum-empty-banner spectrum-empty-cta" role="status">
                    {technique === 'uvvis' ? (
                      <>
                        <strong>No full UV teaching curve</strong> for{' '}
                        <strong>{compound.name}</strong>. IR/Raman may still be available — use those
                        tabs. Enable <em>Has full UV–Vis</em> or open the{' '}
                        <strong>Lab</strong> set for compounds curated with full UV envelopes.
                      </>
                    ) : (
                      <>
                        No {technique === 'ir' ? 'IR' : 'Raman'} series for this compound yet. Never
                        treat an empty panel as measured data.
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
    </>
  )
}
