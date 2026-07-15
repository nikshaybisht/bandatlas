/**
 * Pure helpers shared by tests (and documented contracts for the UI/export).
 */

/** Index / compound entry has a full UV–Vis teaching curve. */
export function hasFullUvVis(entry) {
  if (!entry || typeof entry !== 'object') return false
  if (typeof entry.has_uvvis === 'boolean') return entry.has_uvvis
  if (entry.availability?.uvvis_abs) return true
  if (entry.tier === 'full') return true
  return false
}

/** Search key fields required on every index compound. */
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

/**
 * CSV export contract (matches src/lib/export.ts spectrumToCsv).
 * Used so tests do not need a TS runtime.
 */
export function csvHasRequiredMarkers(csv) {
  if (typeof csv !== 'string' || !csv.length) return false
  const hasHeader =
    csv.includes('# BandAtlas export') &&
    csv.includes('# compound:') &&
    csv.includes('# technique:')
  const hasXy = /^x_(nm|cm-1),y$/m.test(csv) || csv.includes('x_nm,y') || csv.includes('x_cm-1,y')
  return hasHeader && hasXy
}

/** Build a minimal CSV string matching export.ts shape (for unit tests). */
export function buildSampleCsv({ name = 'Benzene', technique = 'uvvis_abs', unitX = 'nm' } = {}) {
  return [
    `# BandAtlas export`,
    `# compound: ${name}`,
    `# id: benzene`,
    `# CAS: 71-43-2`,
    `# formula: C6H6`,
    `# technique: ${technique}`,
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
