import { useState } from 'react'
import type { Compound, TechniqueTab } from '../types'

interface Props {
  compound: Compound
  technique: TechniqueTab
  caption: string
}

const techLabel: Record<TechniqueTab, string> = {
  uvvis: 'UV–Vis',
  ir: 'IR',
  raman: 'Raman',
}

export function ShareCard({ compound, technique, caption }: Props) {
  const [status, setStatus] = useState<string | null>(null)

  const downloadPng = () => {
    const w = 720
    const h = 900
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#0b1220')
    grad.addColorStop(1, '#1e1b4b')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Accent bar
    const bar = ctx.createLinearGradient(0, 0, w, 0)
    bar.addColorStop(0, '#818cf8')
    bar.addColorStop(0.5, '#c084fc')
    bar.addColorStop(1, '#f59e0b')
    ctx.fillStyle = bar
    ctx.fillRect(0, 0, w, 8)

    ctx.fillStyle = '#a5b4fc'
    ctx.font = 'bold 28px system-ui,sans-serif'
    ctx.fillText('MolSpectra', 48, 72)

    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 48px system-ui,sans-serif'
    wrapText(ctx, compound.name, 48, 160, w - 96, 56)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '22px system-ui,sans-serif'
    ctx.fillText(
      `${compound.family_label}  ·  ${techLabel[technique]}`,
      48,
      280,
    )
    if (compound.formula) {
      ctx.fillText(compound.formula, 48, 318)
    }

    // Caption box
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)'
    roundRect(ctx, 40, 360, w - 80, 360, 20)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '24px system-ui,sans-serif'
    wrapText(ctx, caption, 64, 410, w - 128, 34)

    ctx.fillStyle = '#64748b'
    ctx.font = '18px system-ui,sans-serif'
    ctx.fillText('Teaching spectrum · educational use', 48, h - 80)
    ctx.fillText('github.com/nikshaybisht/molspectra', 48, h - 48)

    const a = document.createElement('a')
    a.download = `molspectra-${compound.id}-${technique}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    setStatus('Downloaded PNG')
    setTimeout(() => setStatus(null), 2000)
  }

  const copySummary = async () => {
    const text = [
      `${compound.name} (${compound.formula})`,
      `Family: ${compound.family_label}`,
      `Technique: ${techLabel[technique]}`,
      caption,
      compound.cas ? `CAS ${compound.cas}` : '',
      'MolSpectra · github.com/nikshaybisht/molspectra',
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setStatus('Summary copied')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('Clipboard blocked')
    }
  }

  return (
    <div className="share-block">
      <div className="share-actions">
        <button type="button" className="ghost" onClick={downloadPng}>
          Share card PNG
        </button>
        <button type="button" className="ghost" onClick={copySummary}>
          Copy summary
        </button>
        {status && <span className="share-status">{status}</span>}
      </div>
    </div>
  )
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
