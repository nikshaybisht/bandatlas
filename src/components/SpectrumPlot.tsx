import { useEffect, useMemo, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { Spectrum } from '../types'

type Mode = 'simple' | 'advanced'

interface Props {
  absorption?: Spectrum | null
  emission?: Spectrum | null
  mode: Mode
  showEmission: boolean
  moleculeName?: string
}

function normalizeYs(ys: number[]): number[] {
  const max = Math.max(...ys, 1e-12)
  return ys.map((y) => (y / max) * 100)
}

/** Nearest-neighbor sample so dual series share one x-axis cleanly */
function sampleAt(xs: number[], ys: number[], at: number): number {
  if (!xs.length) return 0
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < xs.length; i++) {
    const d = Math.abs(xs[i] - at)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  if (bestD > 8) return 0
  return ys[best]
}

function colorForWavelength(nm: number): string {
  if (nm < 380) return '#a78bfa'
  if (nm < 450) return '#6366f1'
  if (nm < 495) return '#22d3ee'
  if (nm < 570) return '#4ade80'
  if (nm < 590) return '#facc15'
  if (nm < 620) return '#fb923c'
  if (nm < 750) return '#f87171'
  return '#94a3b8'
}

function peakHint(nm: number): string {
  if (nm < 380) return 'ultraviolet'
  if (nm < 450) return 'violet-blue light'
  if (nm < 495) return 'blue-cyan light'
  if (nm < 570) return 'green light'
  if (nm < 590) return 'yellow light'
  if (nm < 620) return 'orange light'
  if (nm < 750) return 'red light'
  return 'near-infrared'
}

export function SpectrumPlot({
  absorption,
  emission,
  mode,
  showEmission,
  moleculeName,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)

  const caption = useMemo(() => {
    if (absorption?.plain_caption) return absorption.plain_caption
    if (emission?.plain_caption) return emission.plain_caption
    return 'No UV–Vis curve is curated for this molecule yet. You can still explore its family, properties, and 3D structure.'
  }, [absorption, emission])

  const peaks = useMemo(
    () => absorption?.lambda_max_nm?.slice(0, 4) ?? [],
    [absorption],
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    plotRef.current?.destroy()
    plotRef.current = null
    el.innerHTML = ''

    const absPts = absorption?.display_points
    const emPts = showEmission && emission ? emission.display_points : null

    if ((!absPts || absPts.length < 2) && (!emPts || emPts.length < 2)) {
      el.innerHTML = `
        <div class="plot-empty">
          <strong>No UV–Vis curve yet</strong>
          <p>This molecule is in the catalog for search and 3D viewing.<br/>
          A spectrum will appear here in a later data update.</p>
        </div>`
      return
    }

    const absX = absPts?.map((p) => p[0]) ?? []
    const absYraw = absPts?.map((p) => p[1]) ?? []
    const emX = emPts?.map((p) => p[0]) ?? []
    const emYraw = emPts?.map((p) => p[1]) ?? []

    const absY =
      mode === 'simple' && absYraw.length ? normalizeYs(absYraw) : absYraw
    const emY = emYraw.length ? normalizeYs(emYraw) : []

    const xSet = new Set<number>()
    absX.forEach((x) => xSet.add(x))
    emX.forEach((x) => xSet.add(x))
    const xs = [...xSet].sort((a, b) => a - b)

    const series: uPlot.Series[] = [{}]
    const data: uPlot.AlignedData = [xs]

    if (absPts) {
      data.push(xs.map((x) => sampleAt(absX, absY, x)))
      series.push({
        label: mode === 'simple' ? 'How much light is absorbed' : 'ε (absorption)',
        stroke: '#818cf8',
        width: 2.4,
        points: { show: false },
      })
    }
    if (emPts) {
      data.push(xs.map((x) => sampleAt(emX, emY, x)))
      series.push({
        label: mode === 'simple' ? 'Light the molecule glows' : 'Emission (normalized)',
        stroke: '#fbbf24',
        width: 2.1,
        dash: [7, 4],
        points: { show: false },
      })
    }

    const xLabel =
      mode === 'simple'
        ? 'Wavelength (nm) — color of the light'
        : 'Wavelength (nm)'
    const yLabel =
      mode === 'simple'
        ? 'Relative amount (0–100%)'
        : absorption
          ? absorption.y_unit_label
          : 'Relative intensity'

    const width = Math.max(el.clientWidth || 640, 280)
    const height = 360
    const peakList = peaks

    const opts: uPlot.Options = {
      width,
      height,
      class: 'ms-uplot',
      padding: [18, 12, 8, 8],
      cursor: {
        drag: { x: true, y: false },
        focus: { prox: 28 },
        points: { size: 8 },
      },
      legend: { show: true },
      scales: {
        x: { time: false },
        y: {
          auto: true,
          range: (_u, min, max) => [Math.min(0, min), max * 1.12],
        },
      },
      axes: [
        {
          label: xLabel,
          labelSize: 16,
          stroke: '#94a3b8',
          font: '12px system-ui,sans-serif',
          labelFont: '13px system-ui,sans-serif',
          grid: { stroke: 'rgba(148,163,184,0.14)' },
          ticks: { stroke: 'rgba(148,163,184,0.28)' },
        },
        {
          label: yLabel,
          labelSize: 16,
          stroke: '#94a3b8',
          font: '12px system-ui,sans-serif',
          labelFont: '13px system-ui,sans-serif',
          grid: { stroke: 'rgba(148,163,184,0.1)' },
          ticks: { stroke: 'rgba(148,163,184,0.28)' },
          size: 68,
        },
      ],
      series,
      hooks: {
        drawClear: [
          (u) => {
            const ctx = u.ctx
            const { left, top, width: w, height: h } = u.bbox
            const uvRight = u.valToPos(380, 'x', true)
            if (Number.isFinite(uvRight) && uvRight > left) {
              ctx.save()
              ctx.fillStyle = 'rgba(139, 92, 246, 0.08)'
              ctx.fillRect(left, top, Math.min(uvRight, left + w) - left, h)
              ctx.fillStyle = 'rgba(167, 139, 250, 0.55)'
              ctx.font = '11px system-ui,sans-serif'
              if (uvRight - left > 36) ctx.fillText('UV', left + 6, top + 14)
              ctx.restore()
            }
          },
        ],
        draw: [
          (u) => {
            const ctx = u.ctx
            const { left, top, width: w, height: h } = u.bbox

            if (absPts && peakList.length) {
              for (const λ of peakList) {
                const xPx = u.valToPos(λ, 'x', true)
                if (!Number.isFinite(xPx) || xPx < left || xPx > left + w) continue
                const yVal = sampleAt(absX, absY, λ)
                const yPx = u.valToPos(yVal, 'y', true)
                ctx.save()
                ctx.strokeStyle = colorForWavelength(λ)
                ctx.fillStyle = colorForWavelength(λ)
                ctx.lineWidth = 1.2
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(xPx, top + h)
                ctx.lineTo(xPx, Math.min(yPx, top + h))
                ctx.stroke()
                ctx.setLineDash([])
                const label = `${λ} nm`
                ctx.font = 'bold 11px system-ui,sans-serif'
                const tw = ctx.measureText(label).width
                const bx = Math.min(Math.max(left + 2, xPx - tw / 2 - 6), left + w - tw - 14)
                const by = Math.max(top + 4, yPx - 22)
                ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
                ctx.strokeStyle = colorForWavelength(λ)
                roundRect(ctx, bx, by, tw + 12, 18, 6)
                ctx.fill()
                ctx.stroke()
                ctx.fillStyle = '#f8fafc'
                ctx.fillText(label, bx + 6, by + 13)
                ctx.restore()
              }
            }

            const y0 = top + h + 3
            const stripH = 7
            const x0 = u.valToPos(380, 'x', true)
            const x1 = u.valToPos(750, 'x', true)
            if (Number.isFinite(x0) && Number.isFinite(x1)) {
              const grad = ctx.createLinearGradient(x0, 0, x1, 0)
              ;(
                [
                  [0, '#7f00ff'],
                  [0.12, '#0000ff'],
                  [0.28, '#00ffff'],
                  [0.42, '#00ff00'],
                  [0.58, '#ffff00'],
                  [0.75, '#ff7f00'],
                  [1, '#ff0000'],
                ] as [number, string][]
              ).forEach(([t, c]) => grad.addColorStop(t, c))
              ctx.save()
              ctx.fillStyle = grad
              const a = Math.max(left, Math.min(x0, x1))
              const b = Math.min(left + w, Math.max(x0, x1))
              if (b > a) {
                ctx.globalAlpha = 0.9
                ctx.fillRect(a, y0, b - a, stripH)
              }
              ctx.restore()
            }
          },
        ],
      },
    }

    plotRef.current = new uPlot(opts, data, el)

    const onResize = () => {
      if (!plotRef.current || !rootRef.current) return
      plotRef.current.setSize({
        width: Math.max(rootRef.current.clientWidth, 280),
        height,
      })
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    return () => {
      ro.disconnect()
      plotRef.current?.destroy()
      plotRef.current = null
    }
  }, [absorption, emission, mode, showEmission, peaks])

  return (
    <div className="spectrum-panel">
      <div className="spectrum-meta">
        {moleculeName && <span className="chip chip-name">{moleculeName}</span>}
        {absorption?.solvent && <span className="chip">Solvent: {absorption.solvent}</span>}
        {peaks.map((λ) => (
          <span className="chip chip-peak" key={λ} title={peakHint(λ)}>
            Peak ≈ {λ} nm · {peakHint(λ)}
          </span>
        ))}
        {mode === 'advanced' && absorption?.epsilon_max?.[0] != null && (
          <span className="chip">
            ε ≈ {absorption.epsilon_max[0].toLocaleString()} M⁻¹ cm⁻¹
          </span>
        )}
      </div>
      <div ref={rootRef} className="plot-root" />
      <p className="plain-caption">
        <strong>What you&apos;re seeing: </strong>
        {caption}
      </p>
      {mode === 'simple' && (
        <p className="simple-help">
          Higher line = more light taken in (or given off). The rainbow bar shows colors humans
          can see (~380–750 nm). UV is left of that.
        </p>
      )}
      {mode === 'advanced' && absorption?.source && (
        <p className="source-note">
          Source: {absorption.source.citation}
          {absorption.source.note ? ` (${absorption.source.note})` : ''}
        </p>
      )}
    </div>
  )
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
