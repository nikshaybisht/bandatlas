/**
 * Pure export string builders (shared by runtime + Node tests).
 */

export const TEACHING_DISCLAIMER =
  'DISCLAIMER: teaching envelope / model spectrum — NOT experimental SI or certified digitization. Cite primary literature for research numbers.'

export function techniqueLabel(tab) {
  if (tab === 'uvvis') return 'UV-Vis'
  if (tab === 'ir') return 'IR'
  return 'Raman'
}

export function qualityWord(spectrum) {
  if (!spectrum) return 'unknown'
  if (spectrum.quality === 'experimental' && spectrum.example_not_for_citation) {
    return 'schema-example'
  }
  return spectrum.quality || 'teaching'
}

export function spectrumToCsv(spectrum, compound, opts = {}) {
  const unitX =
    spectrum.technique === 'ir' || spectrum.technique === 'raman' ? 'cm-1' : 'nm'
  const quality = spectrum.quality || 'teaching'
  const appVersion = opts.appVersion || '0.0.0'
  const permalink = opts.permalink || ''
  const header = [
    `# BandAtlas lab export`,
    `# ${TEACHING_DISCLAIMER}`,
    `# compound: ${compound.name}`,
    `# id: ${compound.id}`,
    `# CAS: ${compound.cas || 'n/a'}`,
    `# formula: ${compound.formula || 'n/a'}`,
    `# pubchem_cid: ${compound.pubchem_cid ?? 'n/a'}`,
    `# technique: ${spectrum.technique}`,
    `# quality: ${quality}${spectrum.example_not_for_citation ? ' (example-not-for-citation)' : ''}`,
    `# quality_tag: ${quality === 'teaching' ? 'teaching' : quality}`,
    `# solvent_or_conditions: ${spectrum.solvent || 'n/a'}`,
    `# temperature_K: ${spectrum.temperature_K ?? 'n/a'}`,
    `# y_unit: ${spectrum.y_unit_label || spectrum.y_unit || 'n/a'}`,
    `# quality_note: ${spectrum.source?.note || 'see source'}`,
    `# source: ${(spectrum.source?.citation || '').replace(/\n/g, ' ')}`,
    `# doi: ${spectrum.source?.doi || 'n/a'}`,
    `# app_version: BandAtlas v${appVersion}`,
    permalink ? `# permalink: ${permalink}` : null,
    `# exported: ${opts.exportedAt || new Date().toISOString()}`,
    `x_${unitX},y`,
  ].filter((l) => l != null)
  const rows = (spectrum.display_points || []).map(
    ([x, y]) => `${x},${y}`,
  )
  return [...header, ...rows].join('\n')
}

export function labNoteMarkdown(opts) {
  const { compound, spectrum, technique, url } = opts
  const exportedAt = opts.exportedAt || new Date().toISOString()
  const appVersion = opts.appVersion || '0.0.0'
  const quality = spectrum ? qualityWord(spectrum) : 'n/a (no series for technique)'
  const lambda =
    spectrum?.lambda_max_nm && spectrum.lambda_max_nm.length
      ? spectrum.lambda_max_nm.map((n) => `${n} nm`).join(', ')
      : 'n/a'
  const peaks =
    spectrum?.peak_positions && spectrum.peak_positions.length
      ? spectrum.peak_positions
          .map((p, i) => {
            const lab = spectrum.peak_labels?.[i]
            return lab ? `${p} cm⁻¹ (${lab})` : `${p} cm⁻¹`
          })
          .join('; ')
      : ''

  const lines = [
    `## ${compound.name} — lab note (BandAtlas)`,
    ``,
    `> **${TEACHING_DISCLAIMER}**`,
    ``,
    `- **Compound id:** \`${compound.id}\``,
    `- **Name:** ${compound.name}`,
    `- **Formula:** ${compound.formula || 'n/a'}`,
    compound.cas ? `- **CAS:** ${compound.cas}` : null,
    compound.pubchem_cid ? `- **PubChem CID:** ${compound.pubchem_cid}` : null,
    `- **Technique:** ${techniqueLabel(technique)}`,
    `- **Quality:** ${quality}${quality === 'teaching' ? ' (teaching envelope — not certified digitization)' : ''}`,
    spectrum?.solvent ? `- **Solvent / conditions:** ${spectrum.solvent}` : null,
    technique === 'uvvis' ? `- **λ_max:** ${lambda}` : null,
    peaks ? `- **Peak markers:** ${peaks}` : null,
    spectrum?.source?.note ? `- **Source note:** ${spectrum.source.note}` : null,
    spectrum?.source?.citation
      ? `- **Source:** ${spectrum.source.citation.replace(/\n/g, ' ')}`
      : null,
    `- **App version:** BandAtlas v${appVersion}`,
    `- **Exported:** ${exportedAt}`,
    `- **Permalink:** ${url}`,
    ``,
    `### Citation (software)`,
    `Bisht, N. BandAtlas (v${appVersion}). https://github.com/nikshaybisht/bandatlas`,
    ``,
  ]
  return lines.filter((l) => l !== null).join('\n')
}

/** Compact clipboard markdown: citation + compound line. */
export function clipboardMarkdownCitation(opts) {
  const { compound, spectrum, technique, url } = opts
  const appVersion = opts.appVersion || '0.0.0'
  const quality = spectrum ? qualityWord(spectrum) : 'teaching'
  const tech = techniqueLabel(technique)
  return [
    `**${compound.name}** (\`${compound.id}\`, ${compound.formula || 'n/a'}${compound.cas ? `, CAS ${compound.cas}` : ''}) — ${tech}; quality=${quality}.`,
    quality === 'teaching'
      ? `Teaching envelope (not experimental SI). Permalink: ${url}`
      : `Permalink: ${url}`,
    `Cite software: Bisht, N. BandAtlas (v${appVersion}). https://github.com/nikshaybisht/bandatlas`,
  ].join('\n')
}

export function compoundBibtex(compound, opts = {}) {
  const appVersion = opts.appVersion || '0.0.0'
  const key = `bandatlas_${String(compound.id).replace(/[^a-zA-Z0-9]/g, '_')}`
  const url = opts.url || 'https://github.com/nikshaybisht/bandatlas'
  return `@misc{${key},
  title        = {${compound.name} spectral record (BandAtlas)},
  author       = {Bisht, Nikshay},
  year         = {${new Date().getFullYear()}},
  howpublished = {BandAtlas v${appVersion}; compound id: ${compound.id}},
  note         = {CAS ${compound.cas || 'n/a'}; formula ${compound.formula || 'n/a'}. Teaching/curated packaging — verify primary literature before quantitative use.},
  url          = {${url}}
}
`
}

export function spectrumSourceBibtex(compound, spectrum, opts = {}) {
  if (!spectrum?.source?.citation) return ''
  const key = `bandatlas_src_${String(compound.id).replace(/[^a-zA-Z0-9]/g, '_')}`
  const doi = spectrum.source.doi
  const url = spectrum.source.url || opts.url || ''
  return `@misc{${key},
  title        = {Source note for ${compound.name} (${spectrum.technique})},
  note         = {${spectrum.source.citation.replace(/\n/g, ' ').replace(/[{}]/g, '')}},
  year         = {${new Date().getFullYear()}}${doi ? `,\n  doi          = {${doi}}` : ''}${url ? `,\n  url          = {${url}}` : ''}
}
`
}

