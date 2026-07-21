import { useState } from 'react'
import type { Compound, Spectrum, TechniqueTab } from '../types'
import { compoundFlags } from '../types'
import {
  clipboardMarkdownCitation,
  compoundShareUrl,
  exportLabNotePack,
  fullBibtexClipboard,
  qualityWord,
  techniqueLabel,
} from '../lib/export'

function qualityLabel(s: Spectrum | null | undefined): string {
  if (!s) return 'No series'
  if (s.quality === 'experimental' && s.example_not_for_citation) return 'Schema example'
  if (s.quality === 'experimental') return 'Experimental'
  return 'Teaching envelope'
}

type Props = {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  onTechniqueChange: (t: TechniqueTab) => void
}

export function LabDiscussionCard({
  compound,
  spectrum,
  technique,
  onTechniqueChange,
}: Props) {
  const [status, setStatus] = useState<string | null>(null)

  const shareUrl = compoundShareUrl(compound.id, technique)
  const lambda =
    spectrum?.nmr_peaks && spectrum.nmr_peaks.length
      ? spectrum.nmr_peaks.map((p) => `${p.delta_ppm} ppm`).join(', ')
      : spectrum?.lambda_max_nm && spectrum.lambda_max_nm.length
        ? spectrum.lambda_max_nm.map((n) => `${n}`).join(', ') + ' nm'
        : '—'

  const flags = compoundFlags(compound)
  const techSummary = [
    flags.hasFullUvVis ? 'UV–Vis' : null,
    flags.hasNmr1h ? '¹H NMR' : null,
    flags.hasNmr13c ? '¹³C NMR' : null,
    flags.hasMs ? 'MS' : null,
    flags.hasIr ? 'IR' : null,
    flags.hasRaman ? 'Raman' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(null), 2200)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      flash('Link copied')
    } catch {
      flash('Clipboard blocked')
    }
  }

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(
        clipboardMarkdownCitation({ compound, spectrum, technique, url: shareUrl }),
      )
      flash('Markdown citation copied')
    } catch {
      flash('Clipboard blocked')
    }
  }

  const copyBib = async () => {
    try {
      await navigator.clipboard.writeText(fullBibtexClipboard(compound, spectrum, { url: shareUrl }))
      flash('BibTeX copied')
    } catch {
      flash('Clipboard blocked')
    }
  }

  const exportPack = () => {
    exportLabNotePack({
      compound,
      spectrum,
      technique,
      url: shareUrl,
      figureTheme: 'light',
    })
    flash('Lab Note Pack (MD + CSV + figure)')
  }

  return (
    <div className="lab-discussion-card" data-testid="lab-discussion-card">
      <div className="lab-card-head">
        <div>
          <h2 className="lab-card-title">{compound.name}</h2>
          <p className="lab-card-meta">
            <span className="mono">{compound.formula}</span>
            {compound.cas ? ` · CAS ${compound.cas}` : ''}
            {compound.pubchem_cid ? ` · CID ${compound.pubchem_cid}` : ''}
          </p>
        </div>
        <span
          className={`inline-quality ${
            spectrum
              ? spectrum.quality === 'experimental'
                ? spectrum.example_not_for_citation
                  ? 'example'
                  : 'experimental'
                : 'teaching'
              : 'teaching'
          }`}
        >
          {qualityLabel(spectrum)}
        </span>
      </div>

      <dl className="lab-card-grid">
        <div>
          <dt>Techniques available</dt>
          <dd>{techSummary || '—'}</dd>
        </div>
        <div>
          <dt>Active technique</dt>
          <dd>
            <div className="lab-tech-seg" role="group" aria-label="Discussion technique">
              {(['uvvis', 'ir', 'raman'] as const).map((t) => {
                const on =
                  t === 'uvvis' ? flags.hasFullUvVis : t === 'ir' ? flags.hasIr : flags.hasRaman
                return (
                  <button
                    key={t}
                    type="button"
                    className={technique === t ? 'active' : ''}
                    disabled={!on}
                    onClick={() => onTechniqueChange(t)}
                  >
                    {techniqueLabel(t)}
                  </button>
                )
              })}
            </div>
          </dd>
        </div>
        <div>
          <dt>λ_max (active UV)</dt>
          <dd className="mono">{technique === 'uvvis' ? lambda : 'switch to UV–Vis'}</dd>
        </div>
        <div>
          <dt>Quality tag</dt>
          <dd className="mono">{spectrum ? qualityWord(spectrum) : 'n/a'}</dd>
        </div>
        <div className="wide">
          <dt>Source note</dt>
          <dd>{spectrum?.source?.note || spectrum?.source?.citation || '—'}</dd>
        </div>
      </dl>

      <div className="lab-card-actions">
        <button
          type="button"
          className="welcome-primary"
          data-testid="export-lab-note-pack"
          onClick={exportPack}
        >
          Export Lab Note Pack
        </button>
        <button type="button" className="ghost" data-testid="copy-lab-link" onClick={copyLink}>
          Copy link
        </button>
        <button type="button" className="ghost" onClick={copyMd}>
          Copy Markdown
        </button>
        <button type="button" className="ghost" onClick={copyBib}>
          Copy BibTeX
        </button>
        {status && (
          <span className="share-status" role="status">
            {status}
          </span>
        )}
      </div>
      <p className="lab-card-hint">
        Pack = Markdown notebook note + CSV (with teaching disclaimer) + print figure (TEACHING
        MODEL watermark). No zip dependency. Permalink:{' '}
        <code className="mono">{`/c/${compound.id}?tech=${technique}`}</code>
      </p>
    </div>
  )
}
