import { useEffect, useMemo, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { Spectrum, TechniqueTab } from '../types'

type Mode = 'simple' | 'advanced'

interface Props {
  /** Primary spectrum for the active technique */
  primary?: Spectrum | null
  /** UV–Vis emission overlay only */
  emission?: Spectrum | null
  showEmission?: boolean
  mode: Mode
  technique: TechniqueTab
  moleculeName?: string
  /** Optional second molecule spectrum for compare (same technique) */
  compare?: Spectrum | null
  compareName?: string
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

function peakHintNm(nm: number): string {
  if (nm < 380) return 'ultraviolet'
  if (nm < 450) return 'violet-blue light'
  if (nm < 495) return 'blue-cyan light'
  if (nm < 570) return 'green light'
  if (nm < 590) return 'yellow light'
  if (nm < 620) return 'orange light'
  if (nm < 750) return 'red light'
  return 'near-infrared'
}

function irZoneLabel(cm: number): string {
  if (cm >= 3200) return 'O–H / N–H'
  if (cm >= 2800) return 'C–H'
  if (cm >= 2100) return 'triple bonds'
  if (cm >= 1650) return 'C=O region'
  if (cm >= 1500) return 'C=C / rings'
  if (cm >= 1000) return 'fingerprint'
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
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)

  const isWavenumber = technique === 'ir' || technique === 'raman'
  const maxDist = isWavenumber ? 40 : 8

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
    if (isWavenumber) return primary.peak_positions?.slice(0, 5) ?? []
    return primary.lambda_max_nm?.slice(0, 4) ?? []
  }, [primary, isWavenumber])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    plotRef.current?.destroy()
    plotRef.current = null
    el.innerHTML = ''

    const mainPts = primary?.display_points
    const emPts =
      technique === 'uvvis' && showEmission && emission ? emission.display_points : null
    const cmpPts = compare?.display_points ?? null

    if ((!mainPts || mainPts.length < 2) && (!emPts || emPts.length < 2)) {
      el.innerHTML = `
        <div class="plot-empty">
          <strong>No ${technique === 'uvvis' ? 'UV–Vis' : technique.toUpperCase()} curve yet</strong>
          <p>Try another technique tab, or pick a molecule with a full teaching spectrum.</p>
        </div>`
      return
    }

    const series: uPlot.Series[] = [{}]
    const dataArrays: number[][] = []

    const collectX = new Set<number>()
    mainPts?.forEach((p) => collectX.add(p[0]))
    emPts?.forEach((p) => collectX.add(p[0]))
    cmpPts?.forEach((p) => collectX.add(p[0]))
    let xs = [...collectX].sort((a, b) => a - b)
    // IR: plot high → low wavenumber
    if (technique === 'ir') xs = xs.slice().reverse()

    dataArrays.push(xs)

    const pushSeries = (
      pts: [number, number][] | null | undefined,
      label: string,
      stroke: string,
      dash?: number[],
      forceNorm?: boolean,
    ) => {
      if (!pts?.length) return
      const px = pts.map((p) => p[0])
      let py = pts.map((p) => p[1])
      if (mode === 'simple' || forceNorm || isWavenumber) py = normalizeYs(py)
      dataArrays.push(xs.map((x) => sampleAt(px, py, x, maxDist)))
      series.push({
        label,
        stroke,
        width: 2.2,
        dash,
        points: { show: false },
      })
    }

    if (technique === 'uvvis') {
      pushSeries(
        mainPts,
        mode === 'simple' ? 'How much light is absorbed' : 'ε (absorption)',
        '#818cf8',
      )
      pushSeries(
        emPts ?? undefined,
        mode === 'simple' ? 'Light the molecule glows' : 'Emission',
        '#fbbf24',
        [7, 4],
        true,
      )
    } else if (technique === 'ir') {
      pushSeries(mainPts, mode === 'simple' ? 'IR absorption' : 'Relative IR absorbance', '#2dd4bf')
    } else {
      pushSeries(mainPts, mode === 'simple' ? 'Raman scatter' : 'Relative Raman intensity', '#e879f9')
    }

    if (cmpPts) {
      pushSeries(
        cmpPts,
        compareName ? `Compare: ${compareName}` : 'Compare',
        '#f472b6',
        [4, 3],
        true,
      )
    }

    const xLabel = isWavenumber
      ? technique === 'ir'
        ? mode === 'simple'
          ? 'Wavenumber (cm⁻¹) — bond vibration energy'
          : 'Wavenumber (cm⁻¹)'
        : mode === 'simple'
          ? 'Raman shift (cm⁻¹)'
          : 'Raman shift (cm⁻¹)'
      : mode === 'simple'
        ? 'Wavelength (nm) — color of the light'
        : 'Wavelength (nm)'

    const yLabel =
      mode === 'simple'
        ? 'Relative amount (0–100%)'
        : primary?.y_unit_label || 'Relative intensity'

    const width = Math.max(el.clientWidth || 640, 280)
    const height = 360
    const peakList = peaks
    const mainX = mainPts?.map((p) => p[0]) ?? []
    const mainYraw = mainPts?.map((p) => p[1]) ?? []
    const mainY =
      mode === 'simple' || isWavenumber ? normalizeYs(mainYraw) : mainYraw

    const opts: uPlot.Options = {
      width,
      height,
      class: 'ms-uplot',
      padding: [18, 12, 8, 8],
      cursor: { drag: { x: true, y: false }, focus: { prox: 28 }, points: { size: 8 } },
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
            if (technique !== 'uvvis') return
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

            if (mainPts && peakList.length) {
              for (const pk of peakList) {
                const xPx = u.valToPos(pk, 'x', true)
                if (!Number.isFinite(xPx) || xPx < left || xPx > left + w) continue
                const yVal = sampleAt(mainX, mainY, pk, maxDist)
                const yPx = u.valToPos(yVal, 'y', true)
                const col = isWavenumber ? '#2dd4bf' : colorForWavelength(pk)
                ctx.save()
                ctx.strokeStyle = col
                ctx.lineWidth = 1.2
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(xPx, top + h)
                ctx.lineTo(xPx, Math.min(yPx, top + h))
                ctx.stroke()
                ctx.setLineDash([])
                const label = isWavenumber ? `${pk}` : `${pk} nm`
                ctx.font = 'bold 11px system-ui,sans-serif'
                const tw = ctx.measureText(label).width
                const bx = Math.min(Math.max(left + 2, xPx - tw / 2 - 6), left + w - tw - 14)
                const by = Math.max(top + 4, yPx - 22)
                ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
                ctx.strokeStyle = col
                roundRect(ctx, bx, by, tw + 12, 18, 6)
                ctx.fill()
                ctx.stroke()
                ctx.fillStyle = '#f8fafc'
                ctx.fillText(label, bx + 6, by + 13)
                ctx.restore()
              }
            }

            if (technique === 'uvvis') {
              const y0 = top + h + 3
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
                  ctx.fillRect(a, y0, b - a, 7)
                }
                ctx.restore()
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
  ])

  return (
    <div className="spectrum-panel">
      <div className="spectrum-meta">
        {moleculeName && <span className="chip chip-name">{moleculeName}</span>}
        {primary?.solvent && <span className="chip">Conditions: {primary.solvent}</span>}
        {peaks.map((pk, i) => (
          <span
            className="chip chip-peak"
            key={`${pk}-${i}`}
            title={isWavenumber ? irZoneLabel(pk) : peakHintNm(pk)}
          >
            {isWavenumber
              ? `Peak ≈ ${pk} cm⁻¹ · ${primary?.peak_labels?.[i] || irZoneLabel(pk)}`
              : `Peak ≈ ${pk} nm · ${peakHintNm(pk)}`}
          </span>
        ))}
        {mode === 'advanced' && primary?.epsilon_max?.[0] != null && technique === 'uvvis' && (
          <span className="chip">
            ε ≈ {primary.epsilon_max[0].toLocaleString()} M⁻¹ cm⁻¹
          </span>
        )}
      </div>
      <div ref={rootRef} className="plot-root" />
      <p className="plain-caption">
        <strong>Notes. </strong>
        {caption}
      </p>
      {mode === 'simple' && technique === 'uvvis' && (
        <p className="simple-help">
          Ordinate: relative absorption (or emission). Abscissa: wavelength (nm). Shaded region
          left of 380 nm is ultraviolet; the colour bar marks the visible window (~380–750 nm).
        </p>
      )}
      {mode === 'simple' && technique === 'ir' && (
        <p className="simple-help">
          Conventional IR display (high → low cm⁻¹ left → right). Band positions track
          characteristic group frequencies (O–H, C–H, C=O, fingerprint region).
        </p>
      )}
      {mode === 'simple' && technique === 'raman' && (
        <p className="simple-help">
          Abscissa: Raman shift (cm⁻¹). Intensities are relative; polarisable modes (e.g. aromatic
          rings) often dominate teaching envelopes.
        </p>
      )}
      {mode === 'advanced' && primary?.source && (
        <p className="source-note">
          Provenance: {primary.source.citation}
          {primary.source.note ? ` [${primary.source.note}]` : ''}
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
