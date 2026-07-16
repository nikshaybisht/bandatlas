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
import { FeaturedStrip } from '../components/FeaturedStrip'
import { RecentList } from '../components/RecentList'
import { useAppTheme } from '../context/AppThemeContext'
import { TOUR_FEATURED_ID, useDemoTour } from '../context/DemoTourContext'
import { buildSearchIndex, isSearchableCompound } from '../lib/search'
import { loadCompound } from '../lib/loadCompound'
import { datasetUrl } from '../lib/paths'
import { parseTechniqueParam } from '../lib/export'
import {
  clearRecent,
  pushRecent,
  readRecent,
  type RecentEntry,
} from '../lib/history'
import { isWelcomeDismissed } from '../lib/theme'
import type {
  Compound,
  DatasetIndex,
  IndexCompound,
  Spectrum,
  TechniqueTab,
} from '../types'
import { compoundFlags, indexHasFullUvVis } from '../types'

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
    pool.find((c) => indexHasFullUvVis(c)) ||
    pool[0] ||
    data.compounds.find((c) => indexHasFullUvVis(c)) ||
    data.compounds[0]
  return hit?.id ?? null
}

type Props = {
  preset?: ExplorerPreset
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function ExplorerPage({ preset = 'default' }: Props) {
  const isLab = preset === 'lab'
  const { theme } = useAppTheme()
  const { step: tourStep, running: tourRunning, setStep: setTourStep, stopTour } =
    useDemoTour()
  const navigate = useNavigate()
  const { compoundId: routeCompoundId } = useParams<{ compoundId?: string }>()
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') ?? ''
  const techFromUrl = parseTechniqueParam(searchParams.get('tech'))
  const tourExportOpen = tourRunning && tourStep === 'export'

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
  const [recent, setRecent] = useState<RecentEntry[]>(() => readRecent())
  /** When true, do not auto-pick technique from compound availability (deep link owns it). */
  const techLocked = useRef(Boolean(techFromUrl))
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const bootstrapped = useRef(false)
  const tourSeqRef = useRef(false)

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
          setRecent(pushRecent({ id: c.id, name: c.name, formula: c.formula }))
          const flags = compoundFlags(c)
          if (!techLocked.current) {
            if (flags.hasFullUvVis) setTechnique('uvvis')
            else if (flags.hasIr) setTechnique('ir')
            else if (flags.hasRaman) setTechnique('raman')
          } else {
            // Honor deep-link tech if available; otherwise fall back
            const want = technique
            const ok =
              (want === 'uvvis' && flags.hasFullUvVis) ||
              (want === 'ir' && flags.hasIr) ||
              (want === 'raman' && flags.hasRaman)
            if (!ok) {
              if (flags.hasFullUvVis) setTechnique('uvvis')
              else if (flags.hasIr) setTechnique('ir')
              else if (flags.hasRaman) setTechnique('raman')
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
    // Hide schema demos from browse/search (still openable via /c/schema-example-uv)
    let pool = index.compounds.filter(isSearchableCompound)
    if (labSetOnly) pool = pool.filter((c) => c.lab_set)
    if (labClass) {
      pool = pool.filter((c) => (c.lab_classes || []).includes(labClass))
    }
    if (uvOnly) pool = pool.filter((c) => indexHasFullUvVis(c))
    if (experimentalOnly) {
      pool = pool.filter((c) => c.has_experimental && !c.has_experimental_example)
    }
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

  // quick tour sequence — timers are a bit arbitrary, tweak if it feels rushed
  useEffect(() => {
    if (!tourRunning || isLab) {
      tourSeqRef.current = false
      return
    }
    if (selectedId !== TOUR_FEATURED_ID) {
      techLocked.current = true
      setSelectedId(TOUR_FEATURED_ID)
      return
    }
    if (!compound || compound.id !== TOUR_FEATURED_ID) return
    if (tourSeqRef.current) return
    tourSeqRef.current = true

    let cancelled = false
    ;(async () => {
      setTourStep('search')
      setSearchOpen(true)
      setQuery('rhodamine')
      await sleep(2800)
      if (cancelled) return

      setTourStep('uv')
      setQuery('')
      setSearchOpen(false)
      techLocked.current = true
      setTechnique('uvvis')
      await sleep(3000)
      if (cancelled) return

      setTourStep('ir')
      setTechnique('ir')
      await sleep(2800)
      if (cancelled) return

      setTourStep('export')
      setTechnique('uvvis')
      await sleep(3000)
      if (cancelled) return

      setTourStep('filter')
      setUvOnly(true)
      setSearchOpen(true)
      setQuery('')
      await sleep(3200)
      if (cancelled) return

      setTourStep('done')
      setUvOnly(false)
      setSearchOpen(false)
      stopTour()
      if (searchParams.get('tour')) {
        navigate(`/c/${TOUR_FEATURED_ID}?tech=uvvis`, { replace: true })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    tourRunning,
    isLab,
    selectedId,
    compound,
    setTourStep,
    stopTour,
    navigate,
    searchParams,
  ])

  const tourTarget = (id: string) =>
    tourRunning && tourStep === id ? 'tour-active' : ''

  const primary = spectrumForTab(compound, technique)
  const emission =
    technique === 'uvvis'
      ? compound?.spectra.find((s) => s.technique === 'fluorescence')
      : undefined
  const compareSpec = spectrumForTab(compareCompound, technique)

  const tabAvailable = (tab: TechniqueTab) => {
    if (!compound) return false
    const flags = compoundFlags(compound)
    if (tab === 'uvvis') return flags.hasFullUvVis
    if (tab === 'ir') return flags.hasIr
    return flags.hasRaman
  }

  return (
    <>
      <div className="teaching-banner" role="note">
        Teaching envelopes for learning — don&apos;t cite them as instrument SI. Primary literature
        for research numbers.
      </div>

      {isLab && (
        <div className="lab-banner" role="status">
          <strong>Lab set</strong> — curated list (
          {index?.counts.lab_set ?? '—'} compounds, all full UV). Open one, talk, export a note pack
          if you want it in your notebook.
        </div>
      )}

      {!isLab && index && (
        <FeaturedStrip
          compounds={index.compounds}
          selectedId={selectedId}
          onSelect={(id) => select(id)}
        />
      )}

      <div className={`explorer-toolbar ${tourRunning ? 'tour-running' : ''}`}>
        <div
          className={`search-wrap ${tourTarget('search')}`}
          ref={searchBoxRef}
          data-tour-target="search"
        >
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
                        {indexHasFullUvVis(c) ? (
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
                        {c.lab_set || c.labSet ? ' · lab set' : ''}
                        {indexHasFullUvVis(c) ? ' · full UV' : ' · catalog'}
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
            className={`filter-chip ${tourTarget('filter')}`}
            title="Show only compounds with a full UV–Vis curve"
            data-testid="filter-uv-only-label"
            data-tour-target="filter"
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
              <div
                className={`tabs ${tourTarget('uv') || tourTarget('ir')}`}
                role="tablist"
                aria-label="Technique"
                data-tour-target={technique === 'ir' ? 'ir' : 'uv'}
              >
                {(
                  [
                    ['uvvis', 'UV–Vis'],
                    ['ir', 'IR'],
                    ['raman', 'Raman'],
                  ] as const
                ).map(([id, label]) => {
                  const on = tabAvailable(id)
                  const tourHit =
                    (id === 'uvvis' && tourStep === 'uv') ||
                    (id === 'ir' && tourStep === 'ir')
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      className={`tab ${technique === id ? 'active' : ''} ${on ? '' : 'empty'} ${tourHit ? 'tour-active' : ''}`}
                      aria-selected={technique === id}
                      onClick={() => setTechniqueAndUrl(id)}
                      data-tour-target={id === 'uvvis' ? 'uv' : id === 'ir' ? 'ir' : undefined}
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
              <section
                className={`panel spectrum-wrap ${tourTarget('uv') || tourTarget('ir')}`}
                data-tour-target={technique === 'ir' ? 'ir' : 'uv'}
              >
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
                <div className={`tool-row ${tourTarget('export')}`}>
                  <ResearchTools
                    compound={compound}
                    spectrum={primary}
                    technique={technique}
                    forceOpen={tourExportOpen}
                  />
                  <CitationsPanel compound={compound} activeSpectrum={primary} />
                  <ShareCard
                    compound={compound}
                    technique={technique}
                    spectrum={primary}
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
                <RecentList
                  items={recent}
                  selectedId={selectedId}
                  onSelect={(id) => select(id)}
                  onClear={() => {
                    clearRecent()
                    setRecent([])
                  }}
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
