import { useState } from 'react'
import type { Compound, Spectrum, TechniqueTab } from '../types'
import { compoundFlags } from '../types'
import {
  compoundShareUrl,
  exportLabNotePack,
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
  const [linkStatus, setLinkStatus] = useState<string | null>(null)
  const [packStatus, setPackStatus] = useState<string | null>(null)

  const shareUrl = compoundShareUrl(compound.id, technique)
  const lambda =
    spectrum?.lambda_max_nm && spectrum.lambda_max_nm.length
      ? spectrum.lambda_max_nm.map((n) => `${n}`).join(', ') + ' nm'
      : '—'

  const flags = compoundFlags(compound)
  const techSummary = [
    flags.hasFullUvVis ? 'UV–Vis' : null,
    flags.hasIr ? 'IR' : null,
    flags.hasRaman ? 'Raman' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkStatus('Link copied')
      setTimeout(() => setLinkStatus(null), 2000)
    } catch {
      setLinkStatus('Clipboard blocked')
      setTimeout(() => setLinkStatus(null), 2000)
    }
  }

  const exportPack = () => {
    exportLabNotePack({ compound, spectrum, technique, url: shareUrl })
    setPackStatus('Note pack downloaded')
    setTimeout(() => setPackStatus(null), 2500)
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
                  t === 'uvvis'
                    ? flags.hasFullUvVis
                    : t === 'ir'
                      ? flags.hasIr
                      : flags.hasRaman
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
          <dd className="mono">
            {technique === 'uvvis' ? lambda : 'switch to UV–Vis'}
          </dd>
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
        <button
          type="button"
          className="ghost"
          data-testid="copy-lab-link"
          onClick={copyLink}
          title={shareUrl}
        >
          Copy link
        </button>
        {(packStatus || linkStatus) && (
          <span className="share-status" role="status">
            {packStatus || linkStatus}
          </span>
        )}
      </div>
      <p className="lab-card-hint">
        Pack downloads CSV (if series), JSON bundle, Markdown notebook snippet, and a figure PNG.
        Link includes technique: <code className="mono">{`/c/${compound.id}?tech=${technique}`}</code>
      </p>
    </div>
  )
}
