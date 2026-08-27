import { useState, useEffect } from 'react'

const PAGE_SIZE_KEY = 'sagi_page_size'
const PAGE_SIZES = [10, 25, 50]

export default function Pagination({ page, lastPage, total, onPageChange, onPageSizeChange }) {
  const [pageSize, setPageSize] = useState(() => {
    try { return Number(localStorage.getItem(PAGE_SIZE_KEY)) || 25 } catch { return 25 }
  })

  useEffect(() => {
    localStorage.setItem(PAGE_SIZE_KEY, pageSize)
  }, [pageSize])

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value)
    setPageSize(newSize)
    onPageSizeChange?.(newSize)
  }

  if (total === 0) return null

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        <span className="pagination-total">{total} ítems</span>
        <label className="pagination-size-label">
          Mostrar:
          <select className="pagination-size-select" value={pageSize} onChange={handlePageSizeChange}>
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {lastPage > 1 && (
        <nav className="pagination" aria-label="Paginación">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Página anterior"
          >
            ← Ant
          </button>
          <span className="pagination-current" aria-live="polite">
            {page} / {lastPage}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === lastPage}
            aria-label="Página siguiente"
          >
            Sig →
          </button>
        </nav>
      )}
    </div>
  )
}
