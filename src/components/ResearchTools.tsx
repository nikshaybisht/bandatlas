import { useEffect, useRef, useState } from 'react'
import type { Compound, Spectrum, TechniqueTab } from '../types'
import {
  compoundBibtex,
  downloadText,
  spectrumToCsv,
  techniqueLabel,
} from '../lib/export'

interface Props {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
}

export function ResearchTools({ compound, spectrum, technique }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const exportCsv = () => {
    if (!spectrum) return
    downloadText(
      `${compound.id}_${technique}_spectrum.csv`,
      spectrumToCsv(spectrum, compound),
      'text/csv;charset=utf-8',
    )
  }

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      application: 'BandAtlas',
      compound: {
        id: compound.id,
        name: compound.name,
        cas: compound.cas,
        formula: compound.formula,
        mw: compound.mw,
        pubchem_cid: compound.pubchem_cid,
        family: compound.family_label,
      },
      spectrum: spectrum
        ? {
            id: spectrum.id,
            technique: spectrum.technique,
            solvent: spectrum.solvent,
            y_unit: spectrum.y_unit,
            points: spectrum.display_points,
            source: spectrum.source,
          }
        : null,
    }
    downloadText(
      `${compound.id}_${technique}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    )
  }

  return (
    <div className="fold-block" ref={rootRef}>
      <button
        type="button"
        className="fold-toggle"
        aria-expanded={open}
        aria-controls="bandatlas-export-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Export ({techniqueLabel(technique)})</span>
        <span className="fold-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="fold-body" id="bandatlas-export-panel" role="region" aria-label="Export">
          <p className="rt-help">
            Download the plotted series for lab notes. Headers include quality, solvent, and source
            text — keep them. Teaching envelopes are not certified digitizations.
          </p>
          <div className="rt-actions">
            <button type="button" className="ghost" disabled={!spectrum} onClick={exportCsv}>
              CSV
            </button>
            <button type="button" className="ghost" onClick={exportJson}>
              JSON
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                downloadText(
                  `${compound.id}.bib`,
                  compoundBibtex(compound),
                  'application/x-bibtex',
                )
              }
            >
              BibTeX (software stub)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
