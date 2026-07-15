// small helpers for tests + build checks

export function hasFullUvVis(entry) {
  if (!entry || typeof entry !== 'object') return false
  if (typeof entry.hasFullUvVis === 'boolean') return entry.hasFullUvVis
  if (typeof entry.has_uvvis === 'boolean') return entry.has_uvvis
  if (typeof entry.flags?.hasFullUvVis === 'boolean') return entry.flags.hasFullUvVis
  if (typeof entry.availability?.uvvis_abs === 'boolean') return entry.availability.uvvis_abs
  return false
}

export function hasSearchKeyFields(entry) {
  if (!entry || typeof entry !== 'object') return false
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    typeof entry.name === 'string' &&
    entry.name.length > 0 &&
    typeof entry.formula === 'string' &&
    typeof entry.tier === 'string'
  )
}

export function validateExperimentalSpectrum(spectrum) {
  const errors = []
  if (!spectrum || typeof spectrum !== 'object') {
    return { ok: false, errors: ['spectrum missing'] }
  }
  if (spectrum.quality !== 'experimental') {
    errors.push(`quality must be "experimental", got ${JSON.stringify(spectrum.quality)}`)
  }
  if (!spectrum.source || typeof spectrum.source !== 'object') {
    errors.push('source object required')
  } else {
    if (!spectrum.source.citation || typeof spectrum.source.citation !== 'string') {
      errors.push('source.citation required')
    }
    if (!spectrum.source.doi && !spectrum.source.url) {
      errors.push('source.doi or source.url required')
    }
  }
  if (!spectrum.solvent || typeof spectrum.solvent !== 'string') {
    errors.push('solvent required for experimental series')
  }
  if (spectrum.temperature_K != null && typeof spectrum.temperature_K !== 'number') {
    errors.push('temperature_K must be a number when present')
  }
  if (!Array.isArray(spectrum.display_points) || spectrum.display_points.length < 5) {
    errors.push('display_points must be an array with ≥5 [x,y] points')
  } else {
    for (const pt of spectrum.display_points.slice(0, 3)) {
      if (!Array.isArray(pt) || pt.length < 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
        errors.push('display_points entries must be [number, number]')
        break
      }
    }
  }
  if (spectrum.example_not_for_citation != null && typeof spectrum.example_not_for_citation !== 'boolean') {
    errors.push('example_not_for_citation must be boolean when set')
  }
  return { ok: errors.length === 0, errors }
}

export function assertTeachingNotExperimental(spectrum) {
  if (!spectrum) return true
  if (spectrum.quality === 'experimental' && !spectrum.example_not_for_citation) {
    // real experimental is fine
    return true
  }
  if (spectrum.quality === 'teaching') return true
  if (spectrum.quality === 'experimental' && spectrum.example_not_for_citation) return true
  return spectrum.quality === 'teaching' || spectrum.quality === 'experimental'
}

/**
 * CSV export contract (matches src/lib/export.ts spectrumToCsv).
 */
export function csvHasRequiredMarkers(csv) {
  if (typeof csv !== 'string' || !csv.length) return false
  const hasHeader =
    (csv.includes('# BandAtlas export') || csv.includes('# BandAtlas lab export')) &&
    csv.includes('# compound:') &&
    csv.includes('# technique:')
  const hasXy = /^x_(nm|cm-1),y$/m.test(csv) || csv.includes('x_nm,y') || csv.includes('x_cm-1,y')
  return hasHeader && hasXy
}

/** Build a minimal CSV string matching export.ts shape (for unit tests). */
export function buildSampleCsv({
  name = 'Benzene',
  technique = 'uvvis_abs',
  unitX = 'nm',
  quality = 'teaching',
} = {}) {
  return [
    `# BandAtlas export`,
    `# compound: ${name}`,
    `# id: benzene`,
    `# CAS: 71-43-2`,
    `# formula: C6H6`,
    `# technique: ${technique}`,
    `# quality: ${quality}`,
    `# solvent_or_conditions: cyclohexane`,
    `# y_unit: ε / M⁻¹ cm⁻¹`,
    `# quality_note: Tier A teaching spectrum`,
    `# source: Educational multi-Gaussian curve`,
    `# exported: 2026-07-16T00:00:00.000Z`,
    `x_${unitX},y`,
    `254,210`,
    `255,200`,
  ].join('\n')
}

export function qualityBadgeLabel(spectrum) {
  if (!spectrum) return 'Unknown'
  if (spectrum.quality === 'experimental' && spectrum.example_not_for_citation) {
    return 'Schema example'
  }
  if (spectrum.quality === 'experimental') return 'Experimental'
  return 'Teaching envelope'
}
