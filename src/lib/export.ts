import type { Compound, Spectrum, TechniqueTab } from '../types'

export function spectrumToCsv(spectrum: Spectrum, compound: Compound): string {
  const unitX =
    spectrum.technique === 'ir' || spectrum.technique === 'raman' ? 'cm-1' : 'nm'
  const header = [
    `# MolSpectra export`,
    `# compound: ${compound.name}`,
    `# id: ${compound.id}`,
    `# CAS: ${compound.cas || 'n/a'}`,
    `# formula: ${compound.formula || 'n/a'}`,
    `# technique: ${spectrum.technique}`,
    `# solvent_or_conditions: ${spectrum.solvent || 'n/a'}`,
    `# y_unit: ${spectrum.y_unit_label}`,
    `# quality_note: ${spectrum.source?.note || 'see source'}`,
    `# source: ${(spectrum.source?.citation || '').replace(/\n/g, ' ')}`,
    `# exported: ${new Date().toISOString()}`,
    `x_${unitX},y`,
  ]
  const rows = spectrum.display_points.map(([x, y]) => `${x},${y}`)
  return [...header, ...rows].join('\n')
}

export function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function compoundBibtex(compound: Compound): string {
  const key = `molspectra_${compound.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  return `@misc{${key},
  title        = {${compound.name} spectral record (MolSpectra)},
  author       = {MolSpectra contributors},
  year         = {${new Date().getFullYear()}},
  howpublished = {MolSpectra compound id: ${compound.id}},
  note         = {CAS ${compound.cas || 'n/a'}; formula ${compound.formula || 'n/a'}. Teaching/curated packaging — verify primary literature before quantitative use.},
  url          = {https://github.com/nikshaybisht/molspectra}
}
`
}

export function techniqueLabel(tab: TechniqueTab): string {
  if (tab === 'uvvis') return 'UV-Vis'
  if (tab === 'ir') return 'IR'
  return 'Raman'
}
