import type { Compound, Spectrum, TechniqueTab } from '../types'

interface Props {
  compound: Compound
  activeSpectrum?: Spectrum | null
  technique: TechniqueTab
}

function spectrumQualityClass(s?: Spectrum | null) {
  if (!s) return 'catalog'
  if (s.quality === 'experimental' && s.example_not_for_citation) return 'example'
  if (s.quality === 'experimental') return 'experimental'
  return 'teaching'
}

function spectrumQualityLabel(s?: Spectrum | null) {
  if (!s) {
    return 'No curve'
  }
  if (s.quality === 'experimental' && s.example_not_for_citation) {
    return 'Schema example'
  }
  if (s.quality === 'experimental') return 'Experimental'
  return 'Teaching envelope'
}

export function PropertyCard({ compound, activeSpectrum, technique }: Props) {
  const abs = compound.spectra.find((s) => s.technique === 'uvvis_abs')
  const em = compound.spectra.find((s) => s.technique === 'fluorescence')
  const solvent = activeSpectrum?.solvent || abs?.solvent
  const qualityTarget = activeSpectrum ?? null

  return (
    <div className="property-card">
      <div className="prop-header">
        <h2>{compound.name}</h2>
        <div className="badge-stack">
          <span className={`tier-badge ${spectrumQualityClass(qualityTarget)}`}>
            {spectrumQualityLabel(qualityTarget)}
          </span>
          {compound.tier === 'full' && qualityTarget?.quality === 'teaching' && (
            <span className="tier-badge full">Full UV–Vis</span>
          )}
          {compound.tier !== 'full' && !abs && (
            <span className="tier-badge catalog">Catalog / partial</span>
          )}
        </div>
      </div>
      <p className="family-badge">{compound.family_label}</p>
      <p className="summary">{compound.plain_summary}</p>

      {/* Active-spectrum quality + source (always for the selected technique) */}
      {qualityTarget ? (
        <div className="active-spectrum-quality">
          <p className="quality-note">
            <strong>Active series:</strong> {spectrumQualityLabel(qualityTarget)}
            {technique !== 'uvvis' ? ` (${technique.toUpperCase()})` : ' (UV–Vis)'}
            {qualityTarget.quality === 'teaching'
              ? ' — multi-Gaussian / group-frequency model, not a raw instrument file.'
              : qualityTarget.example_not_for_citation
                ? ' — synthetic schema demo; do not cite as data.'
                : ' — open experimental series; verify primary source before quantitative use.'}
          </p>
          {qualityTarget.source?.note && (
            <p className="source-note-line">
              <strong>Source note:</strong> {qualityTarget.source.note}
            </p>
          )}
          {qualityTarget.source?.citation && (
            <p className="source-note-line source-cite" title={qualityTarget.source.citation}>
              <strong>Citation:</strong> {qualityTarget.source.citation}
            </p>
          )}
        </div>
      ) : (
        <p className="quality-note">
          {technique === 'uvvis' ? (
            <>
              <strong>No full UV–Vis teaching curve yet.</strong> IR and Raman teaching envelopes
              are still available on those tabs.
            </>
          ) : (
            <>No active series for this technique.</>
          )}
        </p>
      )}

      <dl className="prop-grid">
        <div>
          <dt>CAS</dt>
          <dd>{compound.cas || '—'}</dd>
        </div>
        <div>
          <dt>Formula</dt>
          <dd className="mono">{compound.formula}</dd>
        </div>
        <div>
          <dt>MW</dt>
          <dd>{compound.mw ? `${compound.mw} g/mol` : '—'}</dd>
        </div>
        <div>
          <dt>PubChem</dt>
          <dd>
            {compound.pubchem_cid ? (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.pubchem_cid}`}
                target="_blank"
                rel="noreferrer"
              >
                CID {compound.pubchem_cid}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        {solvent && (
          <div className="wide">
            <dt>Solvent</dt>
            <dd className="solvent-line">
              solvent = {solvent}
              {technique !== 'uvvis' && activeSpectrum?.solvent
                ? ` (${technique.toUpperCase()})`
                : ''}
            </dd>
          </div>
        )}
        {activeSpectrum?.temperature_K != null && (
          <div>
            <dt>T</dt>
            <dd>{activeSpectrum.temperature_K} K</dd>
          </div>
        )}
        {abs?.lambda_max_nm?.length ? (
          <div>
            <dt>
              λ<sub>max</sub>
            </dt>
            <dd>{abs.lambda_max_nm.join(', ')} nm</dd>
          </div>
        ) : null}
        {em?.quantum_yield != null && (
          <div>
            <dt>
              Φ<sub>f</sub>
            </dt>
            <dd>
              {em.quantum_yield}
              {em.solvent ? ` (solvent = ${em.solvent})` : ''}
            </dd>
          </div>
        )}
      </dl>

      <div className="avail-row">
        <TechniquePill label="UV–Vis" on={compound.availability.uvvis_abs} />
        <TechniquePill label="Fluorescence" on={compound.availability.fluorescence} />
        <TechniquePill label="IR" on={compound.availability.ir} />
        <TechniquePill label="Raman" on={compound.availability.raman} />
      </div>
    </div>
  )
}

function TechniquePill({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`tech-pill ${on ? 'on' : 'off'}`}>
      {label}
      {on ? ' · yes' : ' · —'}
    </span>
  )
}
