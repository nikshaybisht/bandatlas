import type { Compound, Spectrum, TechniqueTab } from '../types'

interface Props {
  compound: Compound
  activeSpectrum?: Spectrum | null
  technique: TechniqueTab
}

export function PropertyCard({ compound, activeSpectrum, technique }: Props) {
  const abs = compound.spectra.find((s) => s.technique === 'uvvis_abs')
  const em = compound.spectra.find((s) => s.technique === 'fluorescence')
  const solvent = activeSpectrum?.solvent || abs?.solvent

  return (
    <div className="property-card">
      <div className="prop-header">
        <h2>{compound.name}</h2>
        <span className={`tier-badge ${compound.tier === 'full' ? 'full' : 'catalog'}`}>
          {compound.tier === 'full'
            ? 'Full UV–Vis'
            : compound.tier === 'partial'
              ? 'IR/Raman'
              : 'Catalog'}
        </span>
      </div>
      <p className="family-badge">{compound.family_label}</p>
      <p className="summary">{compound.plain_summary}</p>

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
