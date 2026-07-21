/**
 * Client-side teaching NMR multiplet simulation (mirrors tools/nmr-lib.mjs).
 * δ ppm + J Hz → Lorentzian envelope at a chosen spectrometer field (MHz).
 */
import type { NmrPeak, Spectrum } from '../types'

type Stick = { delta_ppm: number; height: number; _hz: number; broad: boolean }

function expandMultiplet(peak: NmrPeak): Stick[] {
  const delta = peak.delta_ppm
  const mult = String(peak.multiplicity || 's').toLowerCase().trim()
  const integ =
    typeof peak.integration === 'number' && peak.integration > 0 ? peak.integration : 1
  const js = Array.isArray(peak.j_hz) ? peak.j_hz.filter((j) => typeof j === 'number' && j > 0) : []
  const J = js[0] ?? 7
  const J2 = js[1] ?? J

  let sticks: Stick[] = []

  if (mult === 's' || mult === 'singlet') {
    sticks = [{ delta_ppm: delta, height: 1, _hz: 0, broad: false }]
  } else if (mult === 'd' || mult === 'doublet') {
    sticks = [
      { delta_ppm: delta, height: 1, _hz: -J / 2, broad: false },
      { delta_ppm: delta, height: 1, _hz: J / 2, broad: false },
    ]
  } else if (mult === 't' || mult === 'triplet') {
    sticks = [
      { delta_ppm: delta, height: 1, _hz: -J, broad: false },
      { delta_ppm: delta, height: 2, _hz: 0, broad: false },
      { delta_ppm: delta, height: 1, _hz: J, broad: false },
    ]
  } else if (mult === 'q' || mult === 'quartet') {
    sticks = [
      { delta_ppm: delta, height: 1, _hz: -1.5 * J, broad: false },
      { delta_ppm: delta, height: 3, _hz: -0.5 * J, broad: false },
      { delta_ppm: delta, height: 3, _hz: 0.5 * J, broad: false },
      { delta_ppm: delta, height: 1, _hz: 1.5 * J, broad: false },
    ]
  } else if (mult === 'dd' || mult === 'doublet-of-doublets') {
    const offs = [-J / 2 - J2 / 2, -J / 2 + J2 / 2, J / 2 - J2 / 2, J / 2 + J2 / 2]
    sticks = offs.map((hz) => ({ delta_ppm: delta, height: 1, _hz: hz, broad: false }))
  } else {
    sticks = [{ delta_ppm: delta, height: 1, _hz: 0, broad: true }]
  }

  const sumH = sticks.reduce((a, s) => a + s.height, 0) || 1
  return sticks.map((s) => ({
    ...s,
    height: (s.height / sumH) * integ,
  }))
}

export function simulateNmrPoints(
  nmrPeaks: NmrPeak[] | undefined,
  fieldMhz: number,
): [number, number][] {
  if (!nmrPeaks?.length) return []
  const baseWidth = fieldMhz <= 100 ? 0.012 : 0.004
  const sticks: { delta_ppm: number; height: number; sigma: number }[] = []
  for (const p of nmrPeaks) {
    for (const s of expandMultiplet(p)) {
      sticks.push({
        delta_ppm: s.delta_ppm + s._hz / fieldMhz,
        height: s.height,
        sigma: s.broad ? baseWidth * 4 : baseWidth,
      })
    }
  }
  if (!sticks.length) return []

  const xs = sticks.map((s) => s.delta_ppm)
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  const pad = Math.max(0.5, (hi - lo) * 0.15 + 0.3)
  let xMin = lo - pad
  let xMax = hi + pad
  if (xMax - xMin < 1) {
    const mid = (xMin + xMax) / 2
    xMin = mid - 0.8
    xMax = mid + 0.8
  }

  const step = Math.min(0.002, (xMax - xMin) / 2500)
  const points: [number, number][] = []
  for (let x = xMin; x <= xMax + 1e-12; x += step) {
    let y = 0
    for (const s of sticks) {
      const d = (x - s.delta_ppm) / s.sigma
      y += s.height / (1 + d * d)
    }
    points.push([Math.round(x * 10000) / 10000, Math.round(y * 1000) / 1000])
  }
  const maxY = Math.max(...points.map((p) => p[1]), 1e-9)
  return points.map(([x, y]) => [x, Math.round((y / maxY) * 1000) / 10])
}

/** Return a spectrum view with display_points re-simulated at fieldMhz. */
export function spectrumAtField(spectrum: Spectrum | null | undefined, fieldMhz: number): Spectrum | null {
  if (!spectrum) return null
  if (!spectrum.nmr_peaks?.length) return spectrum
  const display_points = simulateNmrPoints(spectrum.nmr_peaks, fieldMhz)
  return {
    ...spectrum,
    display_points,
    field_mhz_default: fieldMhz,
  }
}

export function isNmrTechnique(tech: string): boolean {
  return tech === 'nmr1h' || tech === 'nmr13c' || tech === 'nmr_1h' || tech === 'nmr_13c'
}
