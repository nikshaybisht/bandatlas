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
  const exportCsv = () => {
    if (!spectrum) return
    const csv = spectrumToCsv(spectrum, compound)
    downloadText(
      `${compound.id}_${technique}_spectrum.csv`,
      csv,
      'text/csv;charset=utf-8',
    )
  }

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      application: 'Chromoscope',
      compound: {
        id: compound.id,
        name: compound.name,
        cas: compound.cas,
        formula: compound.formula,
        mw: compound.mw,
        smiles: compound.smiles,
        pubchem_cid: compound.pubchem_cid,
        family: compound.family_label,
      },
      spectrum: spectrum
        ? {
            id: spectrum.id,
            technique: spectrum.technique,
            solvent: spectrum.solvent,
            y_unit: spectrum.y_unit,
            y_unit_label: spectrum.y_unit_label,
            lambda_max_nm: spectrum.lambda_max_nm,
            peak_positions: spectrum.peak_positions,
            peak_labels: spectrum.peak_labels,
            points: spectrum.display_points,
            source: spectrum.source,
          }
        : null,
      disclaimer:
        'Verify teaching/curated data against primary literature before quantitative claims.',
    }
    downloadText(
      `${compound.id}_${technique}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    )
  }

  const exportBib = () => {
    downloadText(`${compound.id}.bib`, compoundBibtex(compound), 'application/x-bibtex')
  }

  return (
    <div className="research-tools">
      <h3>Export for lab notes / SI</h3>
      <p className="rt-help">
        Download the active {techniqueLabel(technique)} series as CSV (columns: x, y with header
        metadata) or a JSON bundle for notebooks. Always retain the source note in SI tables.
      </p>
      <div className="rt-actions">
        <button type="button" className="ghost" disabled={!spectrum} onClick={exportCsv}>
          Export CSV
        </button>
        <button type="button" className="ghost" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" className="ghost" onClick={exportBib}>
          BibTeX stub
        </button>
      </div>
    </div>
  )
}
