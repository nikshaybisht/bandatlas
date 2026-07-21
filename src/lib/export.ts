import type { Compound, Spectrum, TechniqueTab } from '../types'
import { APP_VERSION } from './version'
import {
  TEACHING_DISCLAIMER,
  clipboardMarkdownCitation as clipboardMarkdownCitationCore,
  compoundBibtex as compoundBibtexCore,
  labNoteMarkdown as labNoteMarkdownCore,
  qualityWord as qualityWordCore,
  spectrumSourceBibtex as spectrumSourceBibtexCore,
  spectrumToCsv as spectrumToCsvCore,
  techniqueLabel as techniqueLabelCore,
} from './exportContracts'

export const TEACHING_DISCLAIMER_LINE = TEACHING_DISCLAIMER

export function spectrumToCsv(
  spectrum: Spectrum,
  compound: Compound,
  opts?: { permalink?: string; exportedAt?: string },
): string {
  return spectrumToCsvCore(spectrum, compound, {
    appVersion: APP_VERSION,
    permalink: opts?.permalink,
    exportedAt: opts?.exportedAt,
  })
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

export function compoundBibtex(compound: Compound, opts?: { url?: string }): string {
  return compoundBibtexCore(compound, { appVersion: APP_VERSION, url: opts?.url })
}

export function spectrumSourceBibtex(
  compound: Compound,
  spectrum: Spectrum | null,
  opts?: { url?: string },
): string {
  if (!spectrum) return ''
  return spectrumSourceBibtexCore(compound, spectrum, opts)
}

/** Software BibTeX + optional spectrum source note as one clipboard string. */
export function fullBibtexClipboard(
  compound: Compound,
  spectrum: Spectrum | null,
  opts?: { url?: string },
): string {
  const soft = compoundBibtex(compound, opts)
  const src = spectrumSourceBibtex(compound, spectrum, opts)
  return src ? `${soft}\n${src}` : soft
}

export function techniqueLabel(tab: TechniqueTab): string {
  return techniqueLabelCore(tab)
}

export function parseTechniqueParam(raw: string | null | undefined): TechniqueTab | null {
  if (!raw) return null
  const v = raw.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, '')
  if (v === 'uvvis' || v === 'uv-vis' || v === 'uv' || v === 'abs') return 'uvvis'
  if (v === 'ir' || v === 'infrared') return 'ir'
  if (v === 'raman' || v === 'ra') return 'raman'
  if (v === 'nmr1h' || v === 'nmr-1h' || v === '1h' || v === 'hnmr' || v === '1hnmr') return 'nmr1h'
  if (v === 'nmr13c' || v === 'nmr-13c' || v === '13c' || v === 'cnmr' || v === '13cnmr')
    return 'nmr13c'
  return null
}

/** Absolute share URL for a compound + technique (respects Vite base). */
export function compoundShareUrl(compoundId: string, technique: TechniqueTab): string {
  const base = import.meta.env.BASE_URL || '/'
  const id = encodeURIComponent(compoundId)
  const path = `${base.replace(/\/?$/, '/') }c/${id}?tech=${technique}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(path, window.location.origin).href
  }
  return path
}

export function qualityWord(spectrum: Spectrum | null | undefined): string {
  return qualityWordCore(spectrum)
}

export function labNoteMarkdown(opts: {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  url: string
  appVersion?: string
  exportedAt?: string
}): string {
  return labNoteMarkdownCore({
    ...opts,
    appVersion: opts.appVersion || APP_VERSION,
  })
}

export function clipboardMarkdownCitation(opts: {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  url: string
}): string {
  return clipboardMarkdownCitationCore({
    ...opts,
    appVersion: APP_VERSION,
  })
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
    disclaimer: TEACHING_DISCLAIMER,
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

export type FigureTheme = 'light' | 'dark'

/**
 * Lab figure card PNG — print-friendly light default, or match app theme.
 * Watermark: TEACHING MODEL
 */
export function buildFigureCardDataUrl(
  compound: Compound,
  technique: TechniqueTab,
  caption: string,
  opts?: { theme?: FigureTheme; spectrum?: Spectrum | null },
): string | null {
  const theme: FigureTheme = opts?.theme ?? 'light'
  const spectrum = opts?.spectrum
  const w = 720
  const h = 900
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = theme === 'light' ? '#fafafa' : '#0b1220'
  const panel = theme === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.95)'
  const text = theme === 'light' ? '#18181b' : '#f8fafc'
  const muted = theme === 'light' ? '#52525b' : '#94a3b8'
  const border = theme === 'light' ? '#e4e4e7' : 'rgba(255,255,255,0.12)'

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const bar = ctx.createLinearGradient(0, 0, w, 0)
  bar.addColorStop(0, '#0f766e')
  bar.addColorStop(0.5, '#6366f1')
  bar.addColorStop(1, '#d97706')
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, w, 8)

  ctx.fillStyle = muted
  ctx.font = '600 18px system-ui,sans-serif'
  ctx.fillText('BandAtlas  ·  lab figure card', 48, 56)

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-0.45)
  ctx.fillStyle = theme === 'light' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(94, 234, 212, 0.12)'
  ctx.font = 'bold 54px system-ui,sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('TEACHING MODEL', 0, 0)
  ctx.restore()

  ctx.fillStyle = text
  ctx.font = 'bold 40px system-ui,sans-serif'
  ctx.textAlign = 'left'
  wrapText(ctx, compound.name, 48, 120, w - 96, 48)

  ctx.fillStyle = muted
  ctx.font = '18px system-ui,sans-serif'
  const meta = [
    compound.family_label,
    techniqueLabel(technique),
    compound.formula,
    compound.cas ? `CAS ${compound.cas}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ')
  wrapText(ctx, meta, 48, 220, w - 96, 26)

  ctx.fillStyle = panel
  roundRect(ctx, 40, 280, w - 80, 200, 12)
  ctx.fill()
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  roundRect(ctx, 40, 280, w - 80, 200, 12)
  ctx.stroke()

  const xLabel = technique === 'uvvis' ? 'Wavelength / nm' : 'Wavenumber / cm⁻¹'
  const yLabel =
    spectrum?.y_unit_label ||
    (technique === 'uvvis' ? 'Relative intensity / ε' : 'Relative intensity')

  ctx.fillStyle = muted
  ctx.font = '14px ui-monospace, monospace'
  ctx.fillText(`X: ${xLabel}`, 64, 320)
  ctx.fillText(`Y: ${yLabel}`, 64, 348)
  ctx.fillText(`Quality: ${qualityWord(spectrum)}`, 64, 376)
  if (spectrum?.solvent) ctx.fillText(`Solvent: ${spectrum.solvent}`, 64, 404)
  ctx.fillStyle = theme === 'light' ? '#0f766e' : '#5eead4'
  ctx.font = 'bold 16px system-ui,sans-serif'
  ctx.fillText('TEACHING MODEL — not experimental SI', 64, 448)

  ctx.fillStyle = panel
  roundRect(ctx, 40, 510, w - 80, 240, 12)
  ctx.fill()
  ctx.strokeStyle = border
  roundRect(ctx, 40, 510, w - 80, 240, 12)
  ctx.stroke()

  ctx.fillStyle = text
  ctx.font = '20px system-ui,sans-serif'
  wrapText(ctx, caption, 64, 560, w - 128, 30)

  ctx.fillStyle = muted
  ctx.font = '15px system-ui,sans-serif'
  ctx.fillText(`${TEACHING_DISCLAIMER.slice(0, 72)}…`, 48, h - 72)
  ctx.fillText(`id: ${compound.id}  ·  BandAtlas v${APP_VERSION}`, 48, h - 44)

  return canvas.toDataURL('image/png')
}

/**
 * Lab Note Pack without zip: Markdown + CSV first (lab notebook), then figure PNG.
 * Staggered downloads so browsers don't drop files.
 */
export function exportLabNotePack(opts: {
  compound: Compound
  spectrum: Spectrum | null
  technique: TechniqueTab
  url: string
  figureTheme?: FigureTheme
}): void {
  const { compound, spectrum, technique, url } = opts
  const stamp = new Date().toISOString()
  const base = `${compound.id}_${technique}_labnote`

  downloadText(
    `${base}.md`,
    labNoteMarkdown({ compound, spectrum, technique, url, exportedAt: stamp }),
    'text/markdown;charset=utf-8',
  )

  window.setTimeout(() => {
    if (spectrum) {
      downloadText(
        `${base}.csv`,
        spectrumToCsv(spectrum, compound, { permalink: url, exportedAt: stamp }),
        'text/csv;charset=utf-8',
      )
    }
  }, 180)

  window.setTimeout(() => {
    downloadText(
      `${base}.json`,
      labNoteJsonBundle({ compound, spectrum, technique, url, exportedAt: stamp }),
      'application/json',
    )
  }, 360)

  window.setTimeout(() => {
    const caption =
      spectrum?.plain_caption || compound.plain_summary || `${compound.name} spectrum`
    const png = buildFigureCardDataUrl(compound, technique, caption, {
      theme: opts.figureTheme ?? 'light',
      spectrum,
    })
    if (png) downloadDataUrl(`bandatlas-${compound.id}-${technique}.png`, png)
  }, 540)
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
