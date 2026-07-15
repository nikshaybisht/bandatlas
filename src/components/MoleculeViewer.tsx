import { useEffect, useRef, useState } from 'react'
import { pubchemSdf2dUrl, pubchemSdfUrl } from '../lib/loadCompound'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Viewer = any

interface Props {
  pubchemCid: number
  name: string
}

export function MoleculeViewer({ pubchemCid, name }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const spinRef = useRef<number | null>(null)
  const styleRef = useRef<'ballstick' | 'stick' | 'sphere'>('ballstick')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [style, setStyle] = useState<'ballstick' | 'stick' | 'sphere'>('ballstick')
  const [spin, setSpin] = useState(true)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  styleRef.current = style

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host || !pubchemCid) {
      setStatus('error')
      setErrorDetail('Missing PubChem ID')
      return
    }

    if (spinRef.current) {
      cancelAnimationFrame(spinRef.current)
      spinRef.current = null
    }
    try {
      viewerRef.current?.clear?.()
    } catch {
      /* ignore */
    }
    host.innerHTML = ''
    viewerRef.current = null
    setStatus('loading')
    setErrorDetail(null)

    ;(async () => {
      try {
        const mod = await import('3dmol')
        // Bundlers expose either default or named createViewer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api: any = (mod as any).default ?? mod
        if (cancelled || !hostRef.current) return

        const isLight =
          typeof document !== 'undefined' &&
          document.documentElement.dataset.theme === 'light'
        const viewer = api.createViewer(hostRef.current, {
          backgroundColor: isLight ? '0xfafafa' : '0x0a0a0b',
          antialias: true,
        })
        viewerRef.current = viewer

        let sdf = ''
        try {
          const r = await fetch(pubchemSdfUrl(pubchemCid))
          if (r.ok) {
            const text = await r.text()
            if (text && !text.includes('Status: 404') && !text.includes('Status: 400')) {
              sdf = text
            }
          }
        } catch {
          /* fall through to 2D */
        }
        if (!sdf) {
          const r2 = await fetch(pubchemSdf2dUrl(pubchemCid))
          if (!r2.ok) throw new Error(`PubChem HTTP ${r2.status}`)
          sdf = await r2.text()
          if (!sdf || sdf.includes('Status: 404')) throw new Error('No structure data')
        }
        if (cancelled) return

        viewer.addModel(sdf, 'sdf')
        applyStyle(viewer, styleRef.current)
        viewer.zoomTo()
        viewer.render()
        setStatus('ready')
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setErrorDetail(e instanceof Error ? e.message : 'Load failed')
        }
      }
    })()

    return () => {
      cancelled = true
      if (spinRef.current) {
        cancelAnimationFrame(spinRef.current)
        spinRef.current = null
      }
      try {
        viewerRef.current?.clear?.()
      } catch {
        /* ignore */
      }
      viewerRef.current = null
      if (host) host.innerHTML = ''
    }
  }, [pubchemCid])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || status !== 'ready') return
    try {
      applyStyle(viewer, style)
      viewer.render()
    } catch {
      /* ignore style glitches */
    }
  }, [style, status])

  useEffect(() => {
    if (spinRef.current) {
      cancelAnimationFrame(spinRef.current)
      spinRef.current = null
    }
    if (!spin || status !== 'ready') return

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let last = performance.now()
    let visible = document.visibilityState === 'visible'

    const onVis = () => {
      visible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVis)

    const tick = (t: number) => {
      const v = viewerRef.current
      if (v && visible) {
        const dt = Math.min(t - last, 50)
        last = t
        try {
          v.rotate(0.04 * dt * 0.34, { x: 0, y: 1, z: 0.08 })
          v.render()
        } catch {
          /* stop spinning if viewer died */
          return
        }
      } else {
        last = t
      }
      spinRef.current = requestAnimationFrame(tick)
    }
    spinRef.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      if (spinRef.current) cancelAnimationFrame(spinRef.current)
      spinRef.current = null
    }
  }, [spin, status, pubchemCid])

  return (
    <div className="mol-viewer">
      <div className="mol-toolbar">
        <span className="mol-title">3D · {name}</span>
        <div className="mol-actions">
          <button
            type="button"
            className={style === 'ballstick' ? 'active' : ''}
            onClick={() => setStyle('ballstick')}
          >
            Ball-stick
          </button>
          <button
            type="button"
            className={style === 'stick' ? 'active' : ''}
            onClick={() => setStyle('stick')}
          >
            Stick
          </button>
          <button
            type="button"
            className={style === 'sphere' ? 'active' : ''}
            onClick={() => setStyle('sphere')}
          >
            Spacefill
          </button>
          <button type="button" className={spin ? 'active' : ''} onClick={() => setSpin((s) => !s)}>
            {spin ? 'Spin on' : 'Spin off'}
          </button>
        </div>
      </div>
      <div ref={hostRef} className="mol-canvas" />
      {status === 'loading' && <div className="mol-status">Loading structure from PubChem…</div>}
      {status === 'error' && (
        <div className="mol-status error">
          Could not load 3D (CID {pubchemCid})
          {errorDetail ? ` — ${errorDetail}` : ''}. Check network.
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyStyle(viewer: any, style: 'ballstick' | 'stick' | 'sphere') {
  viewer.setStyle({}, {})
  if (style === 'ballstick') {
    viewer.setStyle({}, { stick: { radius: 0.12 }, sphere: { scale: 0.22 } })
  } else if (style === 'stick') {
    viewer.setStyle({}, { stick: { radius: 0.15 } })
  } else {
    viewer.setStyle({}, { sphere: { scale: 0.35 } })
  }
}
