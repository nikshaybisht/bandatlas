import type { Compound, Spectrum, TechniqueTab } from '../types'
import { APP_VERSION } from './version'

export function spectrumToCsv(spectrum: Spectrum, compound: Compound): string {
  const unitX =
    spectrum.technique === 'ir' || spectrum.technique === 'raman' ? 'cm-1' : 'nm'
  const quality = spectrum.quality || 'teaching'
  const header = [
    `# BandAtlas export`,
    `# compound: ${compound.name}`,
    `# id: ${compound.id}`,
    `# CAS: ${compound.cas || 'n/a'}`,
    `# formula: ${compound.formula || 'n/a'}`,
    `# technique: ${spectrum.technique}`,
    `# quality: ${quality}${spectrum.example_not_for_citation ? ' (example-not-for-citation)' : ''}`,
    `# solvent_or_conditions: ${spectrum.solvent || 'n/a'}`,
    `# temperature_K: ${spectrum.temperature_K ?? 'n/a'}`,
    `# y_unit: ${spectrum.y_unit_label}`,
    `# quality_note: ${spectrum.source?.note || 'see source'}`,
    `# source: ${(spectrum.source?.citation || '').replace(/\n/g, ' ')}`,
    `# doi: ${spectrum.source?.doi || 'n/a'}`,
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

export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.download = filename
  a.href = dataUrl
  a.click()
}

export function compoundBibtex(compound: Compound): string {
  const key = `bandatlas_${compound.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  return `@misc{${key},
  title        = {${compound.name} spectral record (BandAtlas)},
  author       = {Bisht, Nikshay},
  year         = {${new Date().getFullYear()}},
  howpublished = {BandAtlas compound id: ${compound.id}},
  note         = {CAS ${compound.cas || 'n/a'}; formula ${compound.formula || 'n/a'}. Teaching/curated packaging — verify primary literature before quantitative use.},
  url          = {https://github.com/nikshaybisht/bandatlas}
}
`
}

export function techniqueLabel(tab: TechniqueTab): string {
  if (tab === 'uvvis') return 'UV-Vis'
  if (tab === 'ir') return 'IR'
  return 'Raman'
}

export function parseTechniqueParam(raw: string | null | undefined): TechniqueTab | null {
  if (!raw) return null
  const v = raw.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, '')
  if (v === 'uvvis' || v === 'uv-vis' || v === 'uv' || v === 'abs') return 'uvvis'
  if (v === 'ir' || v === 'infrared') return 'ir'
  if (v === 'raman' || v === 'ra') return 'raman'
  return null
}

/** Absolute share URL for a compound + technique (respects Vite base). */
export function compoundShareUrl(compoundId: string, technique: TechniqueTab): string {
  const base = import.meta.env.BASE_URL || '/'
  const path = `${base.replace(/\/?$/, '/') }c/${compoundId}?tech=${technique}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(path, window.location.origin).href
  }
  return path
}

export function qualityWord(spectrum: Spectrum | null | undefined): string {
  if (!spectrum) return 'unknown'
  if (spectrum.quality === 'experimental' && spectrum.example_not_for_citation) {
    return 'schema-example'
  }
  return spectrum.quality || 'teaching'
}

/** Markdown snippet for lab notebook paste. */
export function labNoteMarkdown(opts: {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  url: string
  appVersion?: string
  exportedAt?: string
}): string {
  const { compound, spectrum, technique, url } = opts
  const exportedAt = opts.exportedAt || new Date().toISOString()
  const appVersion = opts.appVersion || APP_VERSION
  const quality = spectrum ? qualityWord(spectrum) : 'n/a (no series for technique)'
  const lambda =
    spectrum?.lambda_max_nm && spectrum.lambda_max_nm.length
      ? spectrum.lambda_max_nm.map((n) => `${n} nm`).join(', ')
      : 'n/a'
  const peaks =
    spectrum?.peak_positions && spectrum.peak_positions.length
      ? spectrum.peak_positions.map((p, i) => {
          const lab = spectrum.peak_labels?.[i]
          return lab ? `${p} cm⁻¹ (${lab})` : `${p} cm⁻¹`
        }).join('; ')
      : ''

  const lines = [
    `## ${compound.name} — lab note (BandAtlas)`,
    ``,
    `- **Compound id:** \`${compound.id}\``,
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
      ? `- **Source / citation text:** ${spectrum.source.citation.replace(/\n/g, ' ')}`
      : null,
    `- **App version:** BandAtlas v${appVersion}`,
    `- **Exported:** ${exportedAt}`,
    `- **URL:** ${url}`,
    ``,
    `> Teaching envelopes are for lab discussion and notes only. Replace with primary experimental data for publication.`,
    ``,
  ]
  return lines.filter((l) => l !== null).join('\n')
}

export function labNoteJsonBundle(opts: {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  url: string
  appVersion?: string
  exportedAt?: string
}): string {
  const exportedAt = opts.exportedAt || new Date().toISOString()
  const payload = {
    exported_at: exportedAt,
    application: 'BandAtlas',
    app_version: opts.appVersion || APP_VERSION,
    url: opts.url,
    pack: 'lab-note',
    compound: {
      id: opts.compound.id,
      name: opts.compound.name,
      cas: opts.compound.cas,
      formula: opts.compound.formula,
      mw: opts.compound.mw,
      pubchem_cid: opts.compound.pubchem_cid,
      family: opts.compound.family_label,
      lab_set: !!opts.compound.lab_set,
      lab_classes: opts.compound.lab_classes || [],
    },
    technique: opts.technique,
    spectrum: opts.spectrum
      ? {
          id: opts.spectrum.id,
          technique: opts.spectrum.technique,
          quality: opts.spectrum.quality,
          example_not_for_citation: opts.spectrum.example_not_for_citation || false,
          solvent: opts.spectrum.solvent,
          y_unit: opts.spectrum.y_unit,
          y_unit_label: opts.spectrum.y_unit_label,
          lambda_max_nm: opts.spectrum.lambda_max_nm || [],
          peak_positions: opts.spectrum.peak_positions || [],
          peak_labels: opts.spectrum.peak_labels || [],
          plain_caption: opts.spectrum.plain_caption,
          points: opts.spectrum.display_points,
          source: opts.spectrum.source,
        }
      : null,
  }
  return JSON.stringify(payload, null, 2)
}

/** Figure-card PNG as data URL (same visual language as ShareCard). */
export function buildFigureCardDataUrl(
  compound: Compound,
  technique: TechniqueTab,
  caption: string,
): string | null {
  const w = 720
  const h = 900
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#0b1220')
  grad.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const bar = ctx.createLinearGradient(0, 0, w, 0)
  bar.addColorStop(0, '#818cf8')
  bar.addColorStop(0.5, '#c084fc')
  bar.addColorStop(1, '#f59e0b')
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, w, 8)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '20px system-ui,sans-serif'
  ctx.fillText('BandAtlas  |  lab figure card', 48, 64)

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 42px system-ui,sans-serif'
  wrapText(ctx, compound.name, 48, 140, w - 96, 50)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '20px system-ui,sans-serif'
  const meta = [
    compound.family_label,
    techniqueLabel(technique),
    compound.formula,
    compound.cas ? `CAS ${compound.cas}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ')
  wrapText(ctx, meta, 48, 260, w - 96, 28)

  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)'
  roundRect(ctx, 40, 340, w - 80, 380, 12)
  ctx.fill()
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '22px system-ui,sans-serif'
  wrapText(ctx, caption, 64, 390, w - 128, 32)

  ctx.fillStyle = '#64748b'
  ctx.font = '16px system-ui,sans-serif'
  ctx.fillText('Teaching packaging — check primary literature for SI', 48, h - 72)
  ctx.fillText(`id: ${compound.id}  ·  BandAtlas v${APP_VERSION}`, 48, h - 44)

  return canvas.toDataURL('image/png')
}

/** One-click lab note pack: CSV + JSON + MD + PNG (when series exists). */
export function exportLabNotePack(opts: {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  url: string
}): void {
  const { compound, spectrum, technique, url } = opts
  const stamp = new Date().toISOString()
  const base = `${compound.id}_${technique}_labnote`

  if (spectrum) {
    downloadText(`${base}.csv`, spectrumToCsv(spectrum, compound), 'text/csv;charset=utf-8')
  }

  downloadText(
    `${base}.json`,
    labNoteJsonBundle({ compound, spectrum, technique, url, exportedAt: stamp }),
    'application/json',
  )

  downloadText(
    `${base}.md`,
    labNoteMarkdown({ compound, spectrum, technique, url, exportedAt: stamp }),
    'text/markdown;charset=utf-8',
  )

  const caption =
    spectrum?.plain_caption || compound.plain_summary || `${compound.name} spectrum`
  const png = buildFigureCardDataUrl(compound, technique, caption)
  if (png) {
    downloadDataUrl(`bandatlas-${compound.id}-${technique}.png`, png)
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/)
  let line = ''
  let yy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = word
      yy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
