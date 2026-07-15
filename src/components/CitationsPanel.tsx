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

/** Background / methods literature only — not a place to “cite the app for a spectrum”. */
const BACKGROUND_IDS = [
  'taniguchi2018db',
  'nist-webbook',
  'pubchem',
  'pretsch2009',
  'socrates2001',
  'braslavsky2007',
]

function seriesQualityLine(s: Spectrum) {
  if (s.quality === 'experimental' && s.example_not_for_citation) {
    return 'Schema example (synthetic). Not measured — do not cite as experimental data.'
  }
  if (s.quality === 'experimental') {
    return 'Experimental series (open redistribution). Prefer the DOI/URL below for publication SI.'
  }
  return 'Teaching / model series (not a raw instrument file). Use primary literature for experimental values.'
}

export function CitationsPanel({ compound, activeSpectrum }: Props) {
  const [open, setOpen] = useState(false)
  const [refs, setRefs] = useState<Reference[]>([])

  useEffect(() => {
    if (open && refs.length === 0) loadReferences().then(setRefs)
  }, [open, refs.length])

  const background = refs.filter((r) => BACKGROUND_IDS.includes(r.id))

  return (
    <div className="fold-block">
      <button
        type="button"
        className="fold-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Data &amp; references</span>
        <span className="fold-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="fold-body">
          <p className="cite-lead">
            <strong>How to cite a spectrum.</strong> Prefer the{' '}
            <em>primary experimental source</em> (paper or database) for the numbers you report.
            BandAtlas is a viewer / packaging layer. Teaching envelopes must not be treated as
            measured data.
          </p>

          {activeSpectrum?.source && (
            <div className="provenance-box">
              <div className="prov-label">This series</div>
              <p>
                <span
                  className={`inline-quality ${
                    activeSpectrum.quality === 'experimental'
                      ? activeSpectrum.example_not_for_citation
                        ? 'example'
                        : 'experimental'
                      : 'teaching'
                  }`}
                >
                  {activeSpectrum.quality === 'experimental' &&
                  activeSpectrum.example_not_for_citation
                    ? 'Schema example'
                    : activeSpectrum.quality === 'experimental'
                      ? 'Experimental'
                      : 'Teaching envelope'}
                </span>
              </p>
              <p>{seriesQualityLine(activeSpectrum)}</p>
              <p>{activeSpectrum.source.citation}</p>
              {activeSpectrum.solvent && (
                <p className="prov-note">Solvent / conditions: {activeSpectrum.solvent}</p>
              )}
              {activeSpectrum.temperature_K != null && (
                <p className="prov-note">T = {activeSpectrum.temperature_K} K</p>
              )}
              {activeSpectrum.source.doi && (
                <p className="prov-note">
                  DOI:{' '}
                  <a href={doiUrl(activeSpectrum.source.doi)} target="_blank" rel="noreferrer">
                    {activeSpectrum.source.doi}
                  </a>
                </p>
              )}
              {activeSpectrum.source.url && (
                <p className="prov-note">
                  URL:{' '}
                  <a href={activeSpectrum.source.url} target="_blank" rel="noreferrer">
                    {activeSpectrum.source.url}
                  </a>
                </p>
              )}
              {activeSpectrum.source.license && (
                <p className="prov-note">License: {activeSpectrum.source.license}</p>
              )}
              {activeSpectrum.source.note && (
                <p className="prov-note">Note: {activeSpectrum.source.note}</p>
              )}
            </div>
          )}

          <div className="provenance-box">
            <div className="prov-label">Record</div>
            <ul className="prov-list">
              <li>
                <strong>{compound.name}</strong>
                {compound.cas ? ` · CAS ${compound.cas}` : ''}
              </li>
              <li>
                Structure: PubChem
                {compound.pubchem_cid ? ` CID ${compound.pubchem_cid}` : ''}
              </li>
            </ul>
          </div>

          <p className="cite-lead" style={{ marginTop: '0.65rem' }}>
            Background reading (methodology &amp; standard tables — not a substitute for the
            spectrum source above):
          </p>
          <ol className="ref-list">
            {background.map((r, i) => (
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
              </li>
            ))}
          </ol>

          <p className="cite-how">
            Cite BandAtlas only if you are citing the <em>software / packaging</em> itself (see{' '}
            <code>CITATION.cff</code>), not as the origin of an experimental spectrum.
          </p>
        </div>
      )}
    </div>
  )
}
