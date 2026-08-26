import '../styles/skeleton.css'

export function SkeletonLine({ width = '100%', height = '14px', style }) {
  return <div className="skeleton-line" style={{ width, height, ...style }} />
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <SkeletonLine width="60%" height="13px" />
        <SkeletonLine width="50px" height="18px" style={{ borderRadius: '20px' }} />
      </div>
      <div className="skeleton-card-body">
        <SkeletonLine width="90%" height="12px" />
        <SkeletonLine width="70%" height="12px" />
        <div className="skeleton-card-meta">
          <SkeletonLine width="40px" height="11px" />
          <SkeletonLine width="60px" height="11px" />
        </div>
      </div>
      <div className="skeleton-card-footer">
        <SkeletonLine width="50px" height="24px" style={{ borderRadius: '4px' }} />
        <SkeletonLine width="50px" height="24px" style={{ borderRadius: '4px' }} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 8 }) {
  return (
    <div className="table-wrap desktop-only">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><SkeletonLine width="70%" height="12px" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><SkeletonLine width={c === 0 ? '80%' : '60%'} height="12px" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Skeleton({ type = 'table', rows, cols }) {
  if (type === 'card') {
    return (
      <div className="cards-grid mobile-only">
        {Array.from({ length: rows || 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }
  return <SkeletonTable rows={rows} cols={cols} />
}
