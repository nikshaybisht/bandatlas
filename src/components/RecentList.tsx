import type { RecentEntry } from '../lib/history'

type Props = {
  items: RecentEntry[]
  selectedId?: string | null
  onSelect: (id: string) => void
  onClear: () => void
}

export function RecentList({ items, selectedId, onSelect, onClear }: Props) {
  if (items.length === 0) {
    return (
      <div className="recent-list" data-testid="recent-list">
        <div className="recent-head">
          <h3 className="recent-title">Recent</h3>
        </div>
        <p className="recent-empty">No local history yet. Open compounds to fill this list.</p>
      </div>
    )
  }

  return (
    <div className="recent-list" data-testid="recent-list">
      <div className="recent-head">
        <h3 className="recent-title">Recent</h3>
        <button type="button" className="ghost recent-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <p className="recent-hint">Last {items.length} on this device only (localStorage).</p>
      <ul className="recent-items">
        {items.map((e) => (
          <li key={`${e.id}-${e.at}`}>
            <button
              type="button"
              className={`recent-item ${selectedId === e.id ? 'active' : ''}`}
              onClick={() => onSelect(e.id)}
            >
              <span className="recent-name">{e.name}</span>
              {e.formula ? <span className="recent-meta mono">{e.formula}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
