import { useEffect, useRef, useState } from 'react'
import type { Compound, Spectrum, TechniqueTab } from '../types'
import {
  compoundShareUrl,
  downloadText,
  exportLabNotePack,
  spectrumToCsv,
  techniqueLabel,
} from '../lib/export'

interface Props {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  /** Force open (e.g. demo tour export step) */
  forceOpen?: boolean
}

export function ResearchTools({ compound, spectrum, technique, forceOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const permalink = compoundShareUrl(compound.id, technique)

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

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

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(null), 2200)
  }

  const exportCsv = () => {
    if (!spectrum) return
    downloadText(
      `${compound.id}_${technique}_spectrum.csv`,
      spectrumToCsv(spectrum, compound, { permalink }),
      'text/csv;charset=utf-8',
    )
    flash('CSV downloaded')
  }

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      application: 'BandAtlas',
      disclaimer:
        'Teaching envelope / model spectrum — NOT experimental SI or certified digitization.',
      permalink,
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
            quality: spectrum.quality,
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
    flash('JSON downloaded')
  }

  const exportPack = () => {
    exportLabNotePack({ compound, spectrum, technique, url: permalink, figureTheme: 'light' })
    flash('Lab Note Pack (MD + CSV + PNG)')
  }

  return (
    <div className="fold-block" ref={rootRef} data-tour-target="export">
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
            Lab-note exports always mark <strong>quality=teaching</strong> when applicable. Not a
            certified digitization archive — keep the disclaimer in your notebook.
          </p>
          <div className="rt-actions">
            <button
              type="button"
              className="welcome-primary"
              data-testid="export-note-pack-main"
              onClick={exportPack}
            >
              Lab Note Pack
            </button>
            <button type="button" className="ghost" disabled={!spectrum} onClick={exportCsv}>
              CSV
            </button>
            <button type="button" className="ghost" onClick={exportJson}>
              JSON
            </button>
          </div>
          {status && (
            <p className="share-status" role="status">
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
