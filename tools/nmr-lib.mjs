/**
 * Teaching NMR multiplet expansion + Lorentzian envelopes.
 * δ in ppm (field-independent); J in Hz (field-independent).
 * Multiplet width in ppm = J_Hz / field_MHz.
 */

/**
 * Expand a first-order multiplet into stick lines { delta_ppm, height }.
 * @param {{ delta_ppm: number, multiplicity?: string, integration?: number, j_hz?: number[] }} peak
 */
export function expandMultiplet(peak) {
  const delta = peak.delta_ppm
  const mult = String(peak.multiplicity || 's').toLowerCase().trim()
  const integ = typeof peak.integration === 'number' && peak.integration > 0 ? peak.integration : 1
  const js = Array.isArray(peak.j_hz) ? peak.j_hz.filter((j) => typeof j === 'number' && j > 0) : []
  const J = js[0] ?? 7
  const J2 = js[1] ?? J

  /** @type {{ delta_ppm: number, height: number }[]} */
  let sticks = []

  if (mult === 's' || mult === 'singlet') {
    sticks = [{ delta_ppm: delta, height: 1 }]
  } else if (mult === 'd' || mult === 'doublet') {
    // positions in Hz relative to center; converted by caller using field
    sticks = [
      { delta_ppm: delta, height: 1, _hz: -J / 2 },
      { delta_ppm: delta, height: 1, _hz: J / 2 },
    ]
  } else if (mult === 't' || mult === 'triplet') {
    sticks = [
      { delta_ppm: delta, height: 1, _hz: -J },
      { delta_ppm: delta, height: 2, _hz: 0 },
      { delta_ppm: delta, height: 1, _hz: J },
    ]
  } else if (mult === 'q' || mult === 'quartet') {
    sticks = [
      { delta_ppm: delta, height: 1, _hz: -1.5 * J },
      { delta_ppm: delta, height: 3, _hz: -0.5 * J },
      { delta_ppm: delta, height: 3, _hz: 0.5 * J },
      { delta_ppm: delta, height: 1, _hz: 1.5 * J },
    ]
  } else if (mult === 'dd' || mult === 'doublet-of-doublets') {
    const offs = [-J / 2 - J2 / 2, -J / 2 + J2 / 2, J / 2 - J2 / 2, J / 2 + J2 / 2]
    sticks = offs.map((hz) => ({ delta_ppm: delta, height: 1, _hz: hz }))
  } else if (mult === 'dt' || mult === 'doublet-of-triplets') {
    // schematic: doublet of triplets
    const centers = [-J / 2, J / 2]
    sticks = []
    for (const c of centers) {
      sticks.push(
        { delta_ppm: delta, height: 1, _hz: c - J2 },
        { delta_ppm: delta, height: 2, _hz: c },
        { delta_ppm: delta, height: 1, _hz: c + J2 },
      )
    }
  } else {
    // multiplet / unknown — single broader line
    sticks = [{ delta_ppm: delta, height: 1 }]
  }

  // Apply Hz offsets as ppm shifts: Δppm = ΔHz / field_MHz — done in simulate
  const sumH = sticks.reduce((a, s) => a + s.height, 0) || 1
  return sticks.map((s) => ({
    delta_ppm: s.delta_ppm,
    height: (s.height / sumH) * integ,
    _hz: s._hz ?? 0,
    broad: mult === 'm' || mult === 'multiplet',
  }))
}

/**
 * @param {object[]} nmrPeaks
 * @param {{ fieldMhz?: number, xMin?: number, xMax?: number, step?: number, baseWidthPpm?: number }} [opts]
 * @returns {[number, number][]}
 */
export function simulateNmrPoints(nmrPeaks, opts = {}) {
  const fieldMhz = opts.fieldMhz ?? 500
  const baseWidth = opts.baseWidthPpm ?? (fieldMhz <= 100 ? 0.012 : 0.004)
  const sticks = []
  for (const p of nmrPeaks || []) {
    for (const s of expandMultiplet(p)) {
      const dPpm = s.delta_ppm + s._hz / fieldMhz
      sticks.push({
        delta_ppm: dPpm,
        height: s.height,
        sigma: s.broad ? baseWidth * 4 : baseWidth,
      })
    }
  }
  if (!sticks.length) return []

  let xMin = opts.xMin
  let xMax = opts.xMax
  if (xMin == null || xMax == null) {
    const xs = sticks.map((s) => s.delta_ppm)
    const lo = Math.min(...xs)
    const hi = Math.max(...xs)
    const pad = Math.max(0.5, (hi - lo) * 0.15 + 0.3)
    xMin = xMin ?? lo - pad
    xMax = xMax ?? hi + pad
  }
  // Keep sensible windows
  if (xMax - xMin < 1) {
    const mid = (xMin + xMax) / 2
    xMin = mid - 0.8
    xMax = mid + 0.8
  }

  const step = opts.step ?? Math.min(0.002, (xMax - xMin) / 2500)
  /** @type {[number, number][]} */
  const points = []
  for (let x = xMin; x <= xMax + 1e-12; x += step) {
    let y = 0
    for (const s of sticks) {
      const d = (x - s.delta_ppm) / s.sigma
      // Lorentzian-like
      y += s.height / (1 + d * d)
    }
    points.push([Math.round(x * 10000) / 10000, Math.round(y * 1000) / 1000])
  }
  // Normalize max to 100 for teaching display
  const maxY = Math.max(...points.map((p) => p[1]), 1e-9)
  return points.map(([x, y]) => [x, Math.round((y / maxY) * 1000) / 10])
}

/**
 * Build a dataset spectrum record from an NMR seed spectrum block.
 * @param {string} compoundId
 * @param {object} spec
 * @param {'teaching'|'experimental'} quality
 */
export function buildNmrSpectrumRecord(compoundId, spec, quality = 'teaching') {
  const nucleus = spec.nucleus
  const technique = nucleus === '13C' || nucleus === 'C' ? 'nmr_13c' : 'nmr_1h'
  const peaks = spec.peaks || []
  const fieldDefault = 500
  const display_points = simulateNmrPoints(peaks, {
    fieldMhz: fieldDefault,
    xMin: spec.xMin,
    xMax: spec.xMax,
  })
  const deltas = peaks.map((p) => p.delta_ppm).filter((n) => typeof n === 'number')
  const lit =
    spec.source?.citation ||
    spec.source?.lit ||
    'Teaching NMR peak list from standard organic spectroscopy tables (not a raw FID).'

  return {
    id: spec.id || `${compoundId}-${technique}`,
    technique,
    kind: nucleus === '13C' || nucleus === 'C' ? 'nmr-13c' : 'nmr-1h',
    quality: quality === 'experimental' ? 'experimental' : 'teaching',
    nucleus: nucleus === '13C' || nucleus === 'C' ? '13C' : '1H',
    solvent: spec.solvent || 'CDCl3',
    reference: spec.reference || 'TMS',
    temperature_K: spec.temperature_K ?? 298,
    y_unit: 'normalized',
    y_unit_label: 'Relative intensity (teaching)',
    field_mhz_default: fieldDefault,
    nmr_peaks: peaks.map((p) => ({
      delta_ppm: p.delta_ppm,
      multiplicity: p.multiplicity || 's',
      integration: p.integration,
      j_hz: Array.isArray(p.j_hz) ? p.j_hz : [],
      label: p.label,
    })),
    peak_positions: deltas,
    peak_labels: peaks.map(
      (p) =>
        p.label ||
        `${p.delta_ppm} ppm${p.multiplicity ? ` (${p.multiplicity})` : ''}`,
    ),
    plain_caption:
      spec.plain_caption ||
      `Teaching ${nucleus === '13C' || nucleus === 'C' ? '¹³C' : '¹H'} NMR envelope (simulated multiplet shapes).`,
    display_points,
    source: {
      citation: lit,
      license:
        spec.source?.license ||
        'CC-BY-4.0 packaging; teaching peak list — not instrument SI.',
      note: spec.source?.note || 'Tier A teaching NMR — multiplet sketch from δ/J tables',
      ...(spec.source?.doi ? { doi: spec.source.doi } : {}),
      ...(spec.source?.url ? { url: spec.source.url } : {}),
    },
  }
}
