/**
 * Teaching mass spectra: stick peaks → Lorentzian envelope for uPlot.
 * m/z + relative intensity (base peak 100).
 */

export const MS_METHODS = new Set(['ei', 'esi', 'hrms', 'maldi_tof'])

/**
 * @param {{ mz: number, intensity: number }[]} peaks
 * @param {{ xMin?: number, xMax?: number, fwhm?: number }} [opts]
 * @returns {[number, number][]}
 */
export function simulateMsPoints(peaks, opts = {}) {
  if (!Array.isArray(peaks) || !peaks.length) return []
  const sticks = peaks
    .filter((p) => typeof p.mz === 'number' && typeof p.intensity === 'number')
    .map((p) => ({
      mz: p.mz,
      height: Math.max(0, p.intensity),
    }))
  if (!sticks.length) return []

  const maxI = Math.max(...sticks.map((s) => s.height), 1e-9)
  const norm = sticks.map((s) => ({ mz: s.mz, height: (s.height / maxI) * 100 }))

  const mzs = norm.map((s) => s.mz)
  const lo = Math.min(...mzs)
  const hi = Math.max(...mzs)
  const pad = Math.max(5, (hi - lo) * 0.08 + 2)
  const xMin = opts.xMin ?? Math.max(0, lo - pad)
  const xMax = opts.xMax ?? hi + pad
  const fwhm = opts.fwhm ?? Math.max(0.15, (xMax - xMin) / 800)
  const sigma = fwhm / 2.355
  const step = Math.min(0.05, (xMax - xMin) / 3000)

  /** @type {[number, number][]} */
  const points = []
  for (let x = xMin; x <= xMax + 1e-12; x += step) {
    let y = 0
    for (const s of norm) {
      const d = (x - s.mz) / sigma
      y += s.height * Math.exp(-0.5 * d * d)
    }
    // baseline
    y += 0.15
    points.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100])
  }
  const maxY = Math.max(...points.map((p) => p[1]), 1e-9)
  return points.map(([x, y]) => [x, Math.round((y / maxY) * 1000) / 10])
}

/**
 * @param {string} compoundId
 * @param {object} spec  seed spectrum block
 * @param {'teaching'|'experimental'} quality
 */
export function buildMsSpectrumRecord(compoundId, spec, quality = 'teaching') {
  const method = String(spec.method || 'ei').toLowerCase()
  if (!MS_METHODS.has(method)) {
    throw new Error(`${compoundId}: unknown MS method "${method}"`)
  }
  const peaks = (spec.peaks || []).map((p) => ({
    mz: p.mz,
    intensity: p.intensity ?? p.rel_intensity ?? 0,
    formula: p.formula,
    label: p.label,
  }))
  const display_points = simulateMsPoints(peaks, {
    xMin: spec.xMin,
    xMax: spec.xMax,
    fwhm: method === 'hrms' ? 0.08 : method === 'maldi_tof' ? 0.4 : 0.2,
  })
  const mzs = peaks.map((p) => p.mz)
  const lit =
    spec.source?.citation ||
    spec.source?.lit ||
    'Teaching MS peak list (EI/ESI/MALDI schematic) after common organic MS tables — not a vendor raw file.'

  const methodLabel =
    method === 'ei'
      ? 'EI-MS'
      : method === 'esi'
        ? 'ESI-MS'
        : method === 'hrms'
          ? 'HRMS'
          : 'MALDI-TOF'

  return {
    id: spec.id || `${compoundId}-ms-${method}`,
    technique: 'ms',
    kind: `ms-${method}`,
    quality: quality === 'experimental' ? 'experimental' : 'teaching',
    ms_method: method,
    ionization: spec.ionization || methodLabel,
    polarity: spec.polarity || 'positive',
    solvent: spec.solvent,
    matrix: spec.matrix,
    exact_mass: spec.exact_mass,
    molecular_ion_mz: spec.molecular_ion_mz ?? spec.molecular_ion,
    y_unit: 'normalized',
    y_unit_label: 'Relative intensity (% of base peak)',
    ms_peaks: peaks,
    peak_positions: mzs,
    peak_labels: peaks.map(
      (p) => p.label || (p.formula ? `m/z ${p.mz} (${p.formula})` : `m/z ${p.mz}`),
    ),
    plain_caption:
      spec.plain_caption ||
      `Teaching ${methodLabel} stick spectrum (relative intensities schematic).`,
    display_points,
    source: {
      citation: lit,
      license:
        spec.source?.license ||
        'CC-BY-4.0 packaging; teaching peak list — literature m/z often disagree; verify primary papers.',
      note:
        spec.source?.note ||
        'Tier A teaching MS — consolidated teaching peaks, not a multi-paper average',
      ...(spec.source?.doi ? { doi: spec.source.doi } : {}),
      ...(spec.source?.url ? { url: spec.source.url } : {}),
    },
  }
}
