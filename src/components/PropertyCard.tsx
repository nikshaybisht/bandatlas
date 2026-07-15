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
  const qualityTarget = activeSpectrum || abs
  const hasRealExperimental = compound.spectra.some(
    (s) => s.quality === 'experimental' && !s.example_not_for_citation,
  )
  const hasExample = compound.spectra.some(
    (s) => s.quality === 'experimental' && s.example_not_for_citation,
  )

  return (
    <div className="property-card">
      <div className="prop-header">
        <h2>{compound.name}</h2>
        <div className="badge-stack">
          <span className={`tier-badge ${spectrumQualityClass(qualityTarget)}`}>
            {spectrumQualityLabel(qualityTarget)}
          </span>
          {compound.tier === 'full' && qualityTarget?.quality !== 'experimental' && (
            <span className="tier-badge full">Full UV–Vis</span>
          )}
          {compound.tier !== 'full' && !abs && (
            <span className="tier-badge catalog">Catalog / partial</span>
          )}
        </div>
      </div>
      <p className="family-badge">{compound.family_label}</p>
      <p className="summary">{compound.plain_summary}</p>
      {hasRealExperimental ? (
        <p className="quality-note">
          This record includes an <strong>experimental</strong> series (open redistribution). Still
          verify the primary DOI/URL before quantitative use.
        </p>
      ) : hasExample ? (
        <p className="quality-note">
          Schema <strong>example</strong> only — synthetic points for tooling. Not measured data;
          do not cite as a spectrum.
        </p>
      ) : compound.tier === 'full' ? (
        <p className="quality-note">
          UV–Vis curve is a multi-Gaussian <strong>teaching envelope</strong> (literature λ
          <sub>max</sub>), not a certified instrument trace.
        </p>
      ) : (
        <p className="quality-note">
          No full UV–Vis curve yet. IR/Raman are group-frequency teaching envelopes.
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
