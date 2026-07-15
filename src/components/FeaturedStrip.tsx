import type { IndexCompound } from '../types'

const DEFAULT_FEATURED = [
  'rhodamine-b',
  'benzene',
  'anthracene',
  'fluorescein',
  'chlorophyll-a',
  'acetone',
]

type Props = {
  compounds: IndexCompound[]
  onSelect: (id: string) => void
  selectedId?: string | null
}

export function FeaturedStrip({ compounds, onSelect, selectedId }: Props) {
  const byId = new Map(compounds.map((c) => [c.id, c]))
  const featured = DEFAULT_FEATURED.map((id) => byId.get(id)).filter(
    (c): c is IndexCompound => Boolean(c && c.has_uvvis),
  )

  if (featured.length === 0) return null

  return (
    <div className="featured-strip" data-testid="featured-strip" aria-label="Featured compounds">
      <div className="featured-label">Featured · full UV</div>
      <div className="featured-chips">
        {featured.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`featured-chip ${selectedId === c.id ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
            title={`${c.name} (${c.formula})`}
          >
            <span className="featured-name">{c.name}</span>
            <span className="featured-formula mono">{c.formula}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
