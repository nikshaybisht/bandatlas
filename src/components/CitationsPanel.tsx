import { useEffect, useState } from 'react'
import {
  formatCitation,
  doiUrl,
  loadReferences,
  type Reference,
} from '../lib/references'
import type { Compound, Spectrum } from '../types'

interface Props {
  compound: Compound
  activeSpectrum?: Spectrum | null
}

const CORE_IDS = [
  'taniguchi2018db',
  'nist-webbook',
  'pubchem',
  'pretsch2009',
  'socrates2001',
  'braslavsky2007',
  'chromoscope-methods',
]

export function CitationsPanel({ compound, activeSpectrum }: Props) {
  const [refs, setRefs] = useState<Reference[]>([])

  useEffect(() => {
    loadReferences().then(setRefs)
  }, [])

  const core = refs.filter((r) => CORE_IDS.includes(r.id))

  return (
    <div className="citations-panel">
      <h3>References &amp; data provenance</h3>
      <p className="cite-lead">
        Spectral traces in Chromoscope are labeled by quality. Teaching envelopes are for
        orientation and education; they are <strong>not</strong> substitutes for primary
        experimental records when reporting quantitative results.
      </p>

      {activeSpectrum?.source && (
        <div className="provenance-box">
          <div className="prov-label">Active spectrum source</div>
          <p>{activeSpectrum.source.citation}</p>
          {activeSpectrum.source.note && (
            <p className="prov-note">Tag: {activeSpectrum.source.note}</p>
          )}
          {activeSpectrum.source.license && (
            <p className="prov-note">License: {activeSpectrum.source.license}</p>
          )}
        </div>
      )}

      <div className="provenance-box">
        <div className="prov-label">This record</div>
        <ul className="prov-list">
          <li>
            <strong>{compound.name}</strong>
            {compound.cas ? ` · CAS ${compound.cas}` : ''}
          </li>
          <li>Structure / CID: PubChem{compound.pubchem_cid ? ` ${compound.pubchem_cid}` : ''}</li>
          <li>
            Availability — UV–Vis:{' '}
            {compound.availability.uvvis_abs ? 'yes' : 'no'}; IR:{' '}
            {compound.availability.ir ? 'yes' : 'no'}; Raman:{' '}
            {compound.availability.raman ? 'yes' : 'no'}
          </li>
        </ul>
      </div>

      <ol className="ref-list">
        {core.map((r, i) => (
          <li key={r.id}>
            <span className="ref-num">[{i + 1}]</span> {formatCitation(r)}
            {r.doi && (
              <>
                {' '}
                <a href={doiUrl(r.doi)} target="_blank" rel="noreferrer">
                  doi:{r.doi}
                </a>
              </>
            )}
            {!r.doi && r.url && (
              <>
                {' '}
                <a href={r.url} target="_blank" rel="noreferrer">
                  link
                </a>
              </>
            )}
            {r.note && <div className="ref-note">{r.note}</div>}
          </li>
        ))}
      </ol>

      <p className="cite-how">
        Suggested software citation: Bisht, N. (2026). <em>Chromoscope</em> (v0.4.1). GitHub.{' '}
        <a href="https://github.com/nikshaybisht/chromoscope">
          https://github.com/nikshaybisht/chromoscope
        </a>
        . Also see <code>CITATION.cff</code> in the repository.
      </p>
    </div>
  )
}
