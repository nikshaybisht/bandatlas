import { useEffect, useMemo, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { Spectrum, TechniqueTab } from '../types'

type Mode = 'simple' | 'advanced'

interface Props {
  primary?: Spectrum | null
  emission?: Spectrum | null
  showEmission?: boolean
  mode: Mode
  technique: TechniqueTab
  moleculeName?: string
  compare?: Spectrum | null
  compareName?: string
  theme?: 'dark' | 'light'
}

function normalizeYs(ys: number[]): number[] {
  const max = Math.max(...ys, 1e-12)
  return ys.map((y) => (y / max) * 100)
}

function sampleAt(xs: number[], ys: number[], at: number, maxDist: number): number {
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
  if (bestD > maxDist) return 0
  return ys[best]
}

/** Linear interpolation */
function sampleLinear(xs: number[], ys: number[], at: number): number {
  if (!xs.length) return 0
  if (at <= xs[0]) return ys[0]
  if (at >= xs[xs.length - 1]) return ys[ys.length - 1]
  let i = 1
  while (i < xs.length && xs[i] < at) i++
  const x0 = xs[i - 1]
  const x1 = xs[i]
  const y0 = ys[i - 1]
  const y1 = ys[i]
  const t = (at - x0) / (x1 - x0 || 1)
  return y0 + (y1 - y0) * t
}

/**
 * Smooth cubic Hermite sampling (Catmull–Rom style tangents).
 * Removes step / polyline look on emission curves.
 */
function sampleSmooth(xs: number[], ys: number[], at: number): number {
  const n = xs.length
  if (n === 0) return 0
  if (n === 1) return ys[0]
  if (at <= xs[0]) return ys[0]
  if (at >= xs[n - 1]) return ys[n - 1]

  let i = 1
  while (i < n && xs[i] < at) i++
  const i0 = Math.max(0, i - 2)
  const i1 = i - 1
  const i2 = i
  const i3 = Math.min(n - 1, i + 1)

  const x1 = xs[i1]
  const x2 = xs[i2]
  const t = (at - x1) / (x2 - x1 || 1)
  const t2 = t * t
  const t3 = t2 * t

  // Catmull–Rom basis
  const y0 = ys[i0]
  const y1 = ys[i1]
  const y2 = ys[i2]
  const y3 = ys[i3]
  return (
    0.5 *
    (2 * y1 +
      (-y0 + y2) * t +
      (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 +
      (-y0 + 3 * y1 - 3 * y2 + y3) * t3)
  )
}

/**
 * Continuous spectral colour of light at λ (nm) — IG / textbook rainbow style.
 * Uses the classic CIE-ish piecewise map with full saturation (no dull edges).
 */
function wavelengthToRgb(nm: number): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  const l = Math.min(750, Math.max(380, nm))
  if (l < 440) {
    r = -(l - 440) / (440 - 380)
    g = 0
    b = 1
  } else if (l < 490) {
    r = 0
    g = (l - 440) / (490 - 440)
    b = 1
  } else if (l < 510) {
    r = 0
    g = 1
    b = -(l - 510) / (510 - 490)
  } else if (l < 580) {
    r = (l - 510) / (580 - 510)
    g = 1
    b = 0
  } else if (l < 645) {
    r = 1
    g = -(l - 645) / (645 - 580)
    b = 0
  } else {
    r = 1
    g = 0
    b = 0
  }
  // slight roll-off only at extreme ends so reds stay vivid
  let f = 1
  if (l > 700) f = 0.55 + (0.45 * (750 - l)) / 50
  if (l < 420) f = 0.55 + (0.45 * (l - 380)) / 40
  return [
    Math.round(255 * Math.min(1, r * f)),
    Math.round(255 * Math.min(1, g * f)),
    Math.round(255 * Math.min(1, b * f)),
  ]
}

function rgbCss([r, g, b]: [number, number, number]) {
  return `rgb(${r},${g},${b})`
}

/**
 * Colour the solution appears after absorbing at λ_max (rough complementary of absorbed light).
 * e.g. absorbs green (~540 nm) → looks magenta/red.
 */
function appearanceFromAbsorption(nm: number): string {
  if (nm < 380) return '#c4b5fd' // UV — pale violet tint
  if (nm < 420) return '#fde047' // absorbs violet → yellow
  if (nm < 490) return '#fb923c' // absorbs blue → orange
  if (nm < 510) return '#f87171' // absorbs cyan-blue → red
  if (nm < 560) return '#e879f9' // absorbs green → magenta
  if (nm < 590) return '#818cf8' // absorbs yellow → indigo
  if (nm < 630) return '#38bdf8' // absorbs orange → blue
  if (nm < 750) return '#4ade80' // absorbs red → cyan-green
  return '#a3a3a3'
}

/** Colour of emitted light at emission λ_max. */
function emissionLightColor(nm: number): string {
  return rgbCss(wavelengthToRgb(nm))
}

function peakHintNm(nm: number): string {
  if (nm < 380) return 'ultraviolet'
  if (nm < 450) return 'violet–blue'
  if (nm < 495) return 'blue–cyan'
  if (nm < 570) return 'green'
  if (nm < 590) return 'yellow'
  if (nm < 620) return 'orange'
  if (nm < 750) return 'red'
  return 'near-IR'
}

function irZoneLabel(cm: number): string {
  if (cm >= 3200) return 'O–H / N–H'
  if (cm >= 2800) return 'C–H'
  if (cm >= 2100) return 'triple bonds'
  if (cm >= 1650) return 'C=O'
  if (cm >= 1500) return 'C=C / rings'
  return 'fingerprint'
}

export function SpectrumPlot({
  primary,
  emission,
  showEmission = false,
  mode,
  technique,
  moleculeName,
  compare,
  compareName,
  theme = 'dark',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)
  const baseScalesRef = useRef<{
    x: { min: number; max: number }
    y: { min: number; max: number }
  } | null>(null)

  const isWavenumber = technique === 'ir' || technique === 'raman'
  const maxDist = isWavenumber ? 40 : 8

  const zoomBy = (factor: number) => {
    const u = plotRef.current
    if (!u) return
    const xs = u.scales.x
    const ys = u.scales.y
    if (xs.min == null || xs.max == null || ys.min == null || ys.max == null) return
    const xMid = (xs.min + xs.max) / 2
    const yMid = (ys.min + ys.max) / 2
    const xHalf = ((xs.max - xs.min) * factor) / 2
    const yHalf = ((ys.max - ys.min) * factor) / 2
    u.batch(() => {
      u.setScale('x', { min: xMid - xHalf, max: xMid + xHalf })
      u.setScale('y', { min: yMid - yHalf, max: yMid + yHalf })
    })
  }

  const resetZoom = () => {
    const u = plotRef.current
    const base = baseScalesRef.current
    if (!u || !base) return
    u.batch(() => {
      u.setScale('x', { ...base.x })
      u.setScale('y', { ...base.y })
    })
  }

  const absPeak =
    technique === 'uvvis'
      ? primary?.lambda_max_nm?.[0]
      : primary?.peak_positions?.[0]
  const emPeak = emission?.lambda_max_nm?.[0]

  const absLineColor = useMemo(() => {
    if (technique !== 'uvvis' || absPeak == null) {
      if (technique === 'ir') return '#5eead4'
      if (technique === 'raman') return '#e879f9'
      return '#e5e5e5'
    }
    return appearanceFromAbsorption(absPeak)
  }, [technique, absPeak])

  const emLineColor = useMemo(() => {
    if (emPeak == null) return '#fbbf24'
    return emissionLightColor(emPeak)
  }, [emPeak])

  const caption = useMemo(() => {
    if (primary?.plain_caption) return primary.plain_caption
    if (technique === 'uvvis' && emission?.plain_caption) return emission.plain_caption
    const labels: Record<TechniqueTab, string> = {
      uvvis: 'No UV–Vis curve curated yet.',
      ir: 'No IR curve for this molecule yet.',
      raman: 'No Raman curve for this molecule yet.',
    }
    return labels[technique]
  }, [primary, emission, technique])

  const peaks = useMemo(() => {
    if (!primary) return [] as number[]
    if (isWavenumber) return primary.peak_positions?.slice(0, 4) ?? []
    return primary.lambda_max_nm?.slice(0, 4) ?? []
  }, [primary, isWavenumber])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    plotRef.current?.destroy()
    plotRef.current = null
    el.innerHTML = ''

    const absPts = primary?.display_points
    const emPts =
      technique === 'uvvis' && showEmission && emission ? emission.display_points : null
    const cmpPts = compare?.display_points ?? null

    if ((!absPts || absPts.length < 2) && (!emPts || emPts.length < 2)) {
      el.innerHTML = `
        <div class="plot-empty">
          <strong>No ${technique === 'uvvis' ? 'UV–Vis' : technique.toUpperCase()} curve yet</strong>
          <p>Try another technique tab, or pick a different compound.</p>
        </div>`
      return
    }

    const series: uPlot.Series[] = [{}]
    const dataArrays: number[][] = []

    // uPlot requires ascending x — never reverse the data array (IR reverse uses scale.dir)
    const collectX = new Set<number>()
    absPts?.forEach((p) => collectX.add(p[0]))
    emPts?.forEach((p) => collectX.add(p[0]))
    cmpPts?.forEach((p) => collectX.add(p[0]))
    let xs = [...collectX].sort((a, b) => a - b)

    // Ultra-dense x-grid for UV → smooth abs + emission (IG-style continuous curves)
    if (technique === 'uvvis' && xs.length >= 2) {
      const lo = xs[0]
      const hi = xs[xs.length - 1]
      const step = Math.min(0.05, (hi - lo) / 2500)
      const dense: number[] = []
      for (let x = lo; x <= hi + 1e-9; x += step) dense.push(Math.round(x * 10000) / 10000)
      if (dense[dense.length - 1] !== hi) dense.push(hi)
      xs = dense
    }

    dataArrays.push(xs)

    /**
     * Pre-resample a curve onto a fine regular grid with cubic smoothing,
     * then sample that grid onto the shared xs (double-smooth emission).
     */
    const smoothSeriesY = (
      pts: [number, number][],
      forceNorm: boolean,
    ): { px: number[]; py: number[] } => {
      const sorted = [...pts].sort((a, b) => a[0] - b[0])
      let px = sorted.map((p) => p[0])
      let py = sorted.map((p) => p[1])
      if (mode === 'simple' || forceNorm || isWavenumber) py = normalizeYs(py)

      // Fine intermediate grid + cubic sample → continuous emission (no steps)
      const lo = px[0]
      const hi = px[px.length - 1]
      const step = Math.min(0.04, (hi - lo) / 3000)
      const fineX: number[] = []
      const fineY: number[] = []
      for (let x = lo; x <= hi + 1e-9; x += step) {
        const xx = Math.round(x * 10000) / 10000
        fineX.push(xx)
        fineY.push(Math.max(0, sampleSmooth(px, py, xx)))
      }
      if (fineX[fineX.length - 1] !== hi) {
        fineX.push(hi)
        fineY.push(Math.max(0, sampleSmooth(px, py, hi)))
      }
      return { px: fineX, py: fineY }
    }

    const pushSeries = (
      pts: [number, number][] | null | undefined,
      label: string,
      stroke: string,
      width: number,
      dash?: number[],
      forceNorm?: boolean,
      smooth?: boolean,
    ) => {
      if (!pts?.length) return
      let px: number[]
      let py: number[]
      if (smooth) {
        const fine = smoothSeriesY(pts, !!forceNorm)
        px = fine.px
        py = fine.py
      } else {
        const sorted = [...pts].sort((a, b) => a[0] - b[0])
        px = sorted.map((p) => p[0])
        py = sorted.map((p) => p[1])
        if (mode === 'simple' || forceNorm || isWavenumber) py = normalizeYs(py)
      }
      const sampled = xs.map((x) =>
        smooth ? sampleLinear(px, py, x) : sampleAt(px, py, x, maxDist),
      )
      dataArrays.push(sampled)
      series.push({
        label: '',
        stroke,
        width,
        dash,
        points: { show: false },
      })
      void label
    }

    if (technique === 'uvvis') {
      // Both curves use cubic + dense grid for IG-smooth continuous lines
      pushSeries(absPts, '', absLineColor, 3.6, undefined, mode === 'simple', true)
      pushSeries(emPts ?? undefined, '', emLineColor, 3.6, undefined, true, true)
    } else if (technique === 'ir') {
      pushSeries(absPts, '', absLineColor, 3.2)
    } else {
      pushSeries(absPts, '', absLineColor, 3.2)
    }

    if (cmpPts) {
      pushSeries(cmpPts, '', '#a3a3a3', 2.4, [4, 3], true, true)
    }

    // Axis labels kept minimal — no "Relative absorbance" / Value clutter
    const xLabel = isWavenumber
      ? technique === 'ir'
        ? 'cm⁻¹'
        : 'cm⁻¹'
      : 'nm'

    const width = Math.max(el.clientWidth || 640, 280)
    // Extra height so the visible-light band can sit below the x-axis
    const height = technique === 'uvvis' ? 400 : 360
    const peakList = peaks
    const sortedAbs = absPts ? [...absPts].sort((a, b) => a[0] - b[0]) : []
    const mainX = sortedAbs.map((p) => p[0])
    const mainYraw = sortedAbs.map((p) => p[1])
    const mainY =
      mode === 'simple' || isWavenumber ? normalizeYs(mainYraw) : mainYraw

    const isLight = theme === 'light'
    const axisStroke = isLight ? '#71717a' : '#a1a1aa'
    const peakLabelFill = isLight ? '#18181b' : '#ffffff'
    const peakLabelStroke = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.92)'
    const peakMarkerEdge = isLight ? '#ffffff' : '#000000'
    const gridStroke = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
    const yPadTop = 0.28
    // Conventional IR: high → low cm⁻¹ left to right (uPlot scale dir -1)
    const xDir = technique === 'ir' ? -1 : 1
    // Room under x-axis for rainbow strip (~14px band + gap)
    const bottomPad = technique === 'uvvis' ? 22 : 8

    const opts: uPlot.Options = {
      width,
      height,
      class: 'ms-uplot',
      padding: [8, 14, bottomPad, 8],
      cursor: {
        drag: {
          x: true,
          y: true,
          setScale: true,
        },
        focus: { prox: 28 },
        points: { size: 9 },
        bind: {
          dblclick: (u) => {
            return (e) => {
              e.preventDefault()
              const base = baseScalesRef.current
              if (!base) return null
              u.batch(() => {
                u.setScale('x', { min: base.x.min, max: base.x.max })
                u.setScale('y', { min: base.y.min, max: base.y.max })
              })
              return null
            }
          },
        },
      },
      legend: { show: false },
      scales: {
        x: { time: false, dir: xDir as 1 | -1 },
        y: { auto: true },
      },
      axes: [
        {
          label: xLabel,
          labelSize: 14,
          stroke: axisStroke,
          font: '11px "IBM Plex Sans", system-ui, sans-serif',
          labelFont: '12px "IBM Plex Sans", system-ui, sans-serif',
          grid: { stroke: gridStroke },
          ticks: { stroke: gridStroke },
          gap: 4,
        },
        {
          // no y-axis title ("Relative absorbance" / Value removed)
          label: '',
          labelSize: 0,
          stroke: axisStroke,
          font: '11px "IBM Plex Sans", system-ui, sans-serif',
          grid: { stroke: gridStroke },
          ticks: { stroke: gridStroke },
          size: 44,
          gap: 4,
        },
      ],
      series,
      hooks: {
        ready: [
          (u) => {
            // Headroom for peak tags, then lock as base view for reset
            const ys = u.scales.y
            const xSc = u.scales.x
            if (ys.min == null || ys.max == null || xSc.min == null || xSc.max == null) return
            const lo = Math.min(0, ys.min)
            const hi = ys.max + (ys.max - lo) * yPadTop
            // Explicit x range so IR reverse + zoom/reset stay consistent
            const xMin = Math.min(...xs)
            const xMax = Math.max(...xs)
            u.batch(() => {
              u.setScale('x', { min: xMin, max: xMax })
              u.setScale('y', { min: lo, max: hi })
            })
            baseScalesRef.current = {
              x: { min: xMin, max: xMax },
              y: { min: lo, max: hi },
            }
          },
        ],
        draw: [
          (u) => {
            const ctx = u.ctx
            const { left, top, width: w, height: h } = u.bbox

            // Peak markers clipped to the data area only
            ctx.save()
            ctx.beginPath()
            ctx.rect(left, top, w, h)
            ctx.clip()

            const drawPeakLabel = (
              _pk: number,
              xPx: number,
              yPx: number,
              col: string,
              label: string,
            ) => {
              // marker only — no vertical stem line
              ctx.fillStyle = col
              ctx.beginPath()
              ctx.arc(xPx, yPx, 5, 0, Math.PI * 2)
              ctx.fill()
              ctx.strokeStyle = peakMarkerEdge
              ctx.lineWidth = 1.2
              ctx.stroke()

              // large number, no box
              ctx.font = '700 15px "IBM Plex Sans", system-ui, sans-serif'
              const tw = ctx.measureText(label).width
              let tx = xPx - tw / 2
              tx = Math.min(Math.max(left + 3, tx), left + w - tw - 3)
              let ty = yPx - 12
              if (ty < top + 16) ty = yPx + 20
              if (ty > top + h - 8) ty = top + h - 8

              ctx.lineWidth = 3.5
              ctx.strokeStyle = peakLabelStroke
              ctx.lineJoin = 'round'
              ctx.strokeText(label, tx, ty)
              ctx.fillStyle = peakLabelFill
              ctx.fillText(label, tx, ty)
            }

            if (absPts && peakList.length) {
              peakList.forEach((pk) => {
                const xPx = u.valToPos(pk, 'x', true)
                if (!Number.isFinite(xPx) || xPx < left || xPx > left + w) return
                const yVal = sampleAt(mainX, mainY, pk, maxDist)
                let yPx = u.valToPos(yVal, 'y', true)
                if (!Number.isFinite(yPx)) return
                yPx = Math.min(Math.max(yPx, top + 18), top + h - 8)

                const col =
                  technique === 'uvvis'
                    ? appearanceFromAbsorption(pk)
                    : isWavenumber
                      ? '#5eead4'
                      : absLineColor

                const label = isWavenumber ? `${Math.round(pk)}` : `${pk}`
                drawPeakLabel(pk, xPx, yPx, col, label)
              })
            }

            if (technique === 'uvvis' && showEmission && emPeak != null && emPts) {
              const xPx = u.valToPos(emPeak, 'x', true)
              if (Number.isFinite(xPx) && xPx >= left && xPx <= left + w) {
                const emX = emPts.map((p) => p[0])
                const emY = normalizeYs(emPts.map((p) => p[1]))
                const yVal = sampleAt(emX, emY, emPeak, maxDist)
                let yPx = u.valToPos(yVal, 'y', true)
                yPx = Math.min(Math.max(yPx, top + 18), top + h - 8)
                drawPeakLabel(emPeak, xPx, yPx, emLineColor, `${emPeak}`)
              }
            }

            ctx.restore()

            // IG-style continuous prism band BELOW the x-axis (smooth rainbow, not pixel blocks)
            if (technique === 'uvvis') {
              const stripH = 18
              const axisSpace =
                (u.axes[0] && typeof (u.axes[0] as { _size?: number })._size === 'number'
                  ? (u.axes[0] as { _size: number })._size
                  : 40) || 40
              const y0 = top + h + Math.min(axisSpace, 36) + 3
              const nm0 = 380
              const nm1 = 750
              const xL = u.valToPos(nm0, 'x', true)
              const xR = u.valToPos(nm1, 'x', true)
              if (Number.isFinite(xL) && Number.isFinite(xR)) {
                const xStart = Math.min(xL, xR)
                const xEnd = Math.max(xL, xR)
                const span = xEnd - xStart
                if (span > 2) {
                  ctx.save()
                  // 1px columns of true spectral colour → continuous prism (IG look)
                  const cols = Math.max(64, Math.ceil(span))
                  for (let i = 0; i < cols; i++) {
                    const t = (i + 0.5) / cols
                    const nm = nm0 + (nm1 - nm0) * t
                    const bx = xStart + (span * i) / cols
                    const bw = span / cols + 0.75
                    ctx.fillStyle = rgbCss(wavelengthToRgb(nm))
                    ctx.fillRect(bx, y0, bw, stripH)
                  }
                  // soft top edge so it sits under the axis cleanly
                  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.moveTo(xStart, y0)
                  ctx.lineTo(xEnd, y0)
                  ctx.stroke()
                  ctx.restore()
                }
              }
            }
          },
        ],
      },
    }

    plotRef.current = new uPlot(opts, dataArrays as uPlot.AlignedData, el)

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
      baseScalesRef.current = null
    }
  }, [
    primary,
    emission,
    showEmission,
    mode,
    technique,
    compare,
    compareName,
    peaks,
    isWavenumber,
    maxDist,
    absLineColor,
    emLineColor,
    emPeak,
    theme,
  ])

  return (
    <div className="spectrum-panel">
      <div className="spectrum-meta">
        {moleculeName && <span className="chip chip-name">{moleculeName}</span>}
        {primary?.solvent && (
          <span className="chip">solvent = {primary.solvent}</span>
        )}
        {peaks.slice(0, 3).map((pk, i) => (
          <span
            className="chip chip-peak"
            key={`${pk}-${i}`}
            style={
              technique === 'uvvis'
                ? {
                    borderColor: appearanceFromAbsorption(pk),
                    color: appearanceFromAbsorption(pk),
                  }
                : undefined
            }
            title={
              isWavenumber
                ? irZoneLabel(pk)
                : `Absorbs ${peakHintNm(pk)}; curve tint = apparent solution colour`
            }
          >
            {isWavenumber ? `${Math.round(pk)} cm⁻¹` : `λ_max ${pk} nm`}
          </span>
        ))}
        {technique === 'uvvis' && showEmission && emPeak != null && (
          <span
            className="chip chip-peak"
            style={{ borderColor: emLineColor, color: emLineColor }}
            title="Emission wavelength — chip colour is the emitted light"
          >
            λ_em {emPeak} nm
          </span>
        )}
      </div>
      <div className="zoom-toolbar" role="toolbar" aria-label="Spectrum zoom">
        <button type="button" className="ghost zoom-btn" onClick={() => zoomBy(0.6)} title="Zoom in">
          Zoom in
        </button>
        <button type="button" className="ghost zoom-btn" onClick={() => zoomBy(1.65)} title="Zoom out">
          Zoom out
        </button>
        <button type="button" className="ghost zoom-btn" onClick={resetZoom} title="Reset to full spectrum">
          Reset view
        </button>
      </div>
      <div
        ref={rootRef}
        className={`plot-root ${technique === 'ir' ? 'plot-ir' : ''} ${technique === 'raman' ? 'plot-raman' : ''}`}
      />
      {/* Short teaching caption only — no long provenance/source dump under the plot */}
      {mode === 'simple' && caption && (
        <p className="plain-caption">
          <strong>Notes. </strong>
          {caption}
        </p>
      )}
    </div>
  )
}


